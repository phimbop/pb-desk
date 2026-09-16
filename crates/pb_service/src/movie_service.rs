use crate::api_client::MovieApiClient;
use crate::keydb_client::KeydbClient;
use crate::surreal_client::SurrealClient;
use pb_core::error::PbResult;
use pb_core::models::{
    AdultMovieRecord, HomePayload, Leaderboards, Movie, MovieDetail, NamedItem, PaginatedResult,
    WatchingItem,
};
use pb_core::traits::MovieCacheRepository;
use std::sync::Arc;

pub struct MovieService {
    api_client: MovieApiClient,
    surreal_client: SurrealClient,
    keydb_client: KeydbClient,
    cache: Arc<dyn MovieCacheRepository>,
}

impl MovieService {
    pub fn new(api_client: MovieApiClient, cache: Arc<dyn MovieCacheRepository>) -> Self {
        Self {
            api_client,
            surreal_client: SurrealClient::new(),
            keydb_client: KeydbClient::new(),
            cache,
        }
    }

    pub fn with_clients(
        api_client: MovieApiClient,
        surreal_client: SurrealClient,
        keydb_client: KeydbClient,
        cache: Arc<dyn MovieCacheRepository>,
    ) -> Self {
        Self {
            api_client,
            surreal_client,
            keydb_client,
            cache,
        }
    }

    pub async fn get_watching_list(&self, limit: usize) -> PbResult<Vec<WatchingItem>> {
        self.keydb_client
            .get_watching_list(&self.surreal_client, limit)
            .await
    }

    pub async fn record_watching_heartbeat(&self, movie_id: &str, session_id: &str) -> PbResult<()> {
        self.keydb_client.record_heartbeat(movie_id, session_id).await
    }

    pub async fn ping_keydb(&self) -> PbResult<String> {
        self.keydb_client.ping().await
    }

    pub async fn get_adult_movies(&self) -> PbResult<Vec<AdultMovieRecord>> {
        const CACHE_KEY: &str = "surreal_adult_movies";

        // Check SQLite cache first for sub-millisecond retrieval
        if let Ok(Some(cached_json)) = self.cache.get_cached_json(CACHE_KEY) {
            if let Ok(items) = serde_json::from_str::<Vec<AdultMovieRecord>>(&cached_json) {
                if !items.is_empty() {
                    return Ok(items);
                }
            }
        }

        // Fetch from SurrealDB
        match self.surreal_client.get_adult_movies().await {
            Ok(items) => {
                if let Ok(json_str) = serde_json::to_string(&items) {
                    // Cache for 2 hours (7200 seconds)
                    let _ = self.cache.set_cached_json(CACHE_KEY, &json_str, 7200);
                }
                Ok(items)
            }
            Err(e) => {
                // If network fails (e.g. offline), try returning cached data
                if let Ok(Some(cached_json)) = self.cache.get_cached_json(CACHE_KEY) {
                    if let Ok(items) = serde_json::from_str::<Vec<AdultMovieRecord>>(&cached_json) {
                        if !items.is_empty() {
                            return Ok(items);
                        }
                    }
                }
                Err(e)
            }
        }
    }

    pub async fn get_leaderboards(&self) -> PbResult<Leaderboards> {
        const CACHE_KEY: &str = "surreal_leaderboards_monthly";

        // Check SQLite cache first for sub-millisecond retrieval
        if let Ok(Some(cached_json)) = self.cache.get_cached_json(CACHE_KEY) {
            if let Ok(lb) = serde_json::from_str::<Leaderboards>(&cached_json) {
                return Ok(lb);
            }
        }

        // Fetch from SurrealDB
        match self.surreal_client.get_leaderboards().await {
            Ok(lb) => {
                if let Ok(json_str) = serde_json::to_string(&lb) {
                    // Cache for 5 minutes (300 seconds)
                    let _ = self.cache.set_cached_json(CACHE_KEY, &json_str, 300);
                }
                Ok(lb)
            }
            Err(e) => {
                // If network fails (e.g. offline), try returning cached data
                if let Ok(Some(cached_json)) = self.cache.get_cached_json(CACHE_KEY) {
                    if let Ok(lb) = serde_json::from_str::<Leaderboards>(&cached_json) {
                        return Ok(lb);
                    }
                }
                Err(e)
            }
        }
    }

    pub async fn get_home_data(&self) -> PbResult<HomePayload> {
        // Fetch featured single and series concurrently
        let (series_res, single_res, new_res) = tokio::join!(
            self.api_client.get_movies_by_list("phim-bo", 1, 10),
            self.api_client.get_movies_by_list("phim-le", 1, 10),
            self.api_client.get_new_updates(1)
        );

        let featured_series = series_res.map(|r| r.items).unwrap_or_default();
        let featured_single = single_res.map(|r| r.items).unwrap_or_default();
        let new_updates = new_res.map(|r| r.items).unwrap_or_default();

        let categories = default_categories();
        let countries = default_countries();

        Ok(HomePayload {
            featured_series,
            featured_single,
            new_updates,
            categories,
            countries,
        })
    }

    pub async fn get_movie_detail(&self, slug: &str) -> PbResult<MovieDetail> {
        // Check cache first
        if let Ok(Some(cached)) = self.cache.get_cached_movie(slug) {
            return Ok(cached);
        }

        let detail = self.api_client.get_movie_detail(slug).await?;
        // Cache for 1 hour (3600 secs)
        let _ = self.cache.set_cached_movie(&detail, 3600);

        Ok(detail)
    }

    pub async fn get_movies_by_type(
        &self,
        movie_type: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        self.api_client.get_movies_by_list(movie_type, page, limit).await
    }

    pub async fn get_movies_by_category(
        &self,
        category: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        self.api_client.get_movies_by_category(category, page, limit).await
    }

    pub async fn get_movies_by_country(
        &self,
        country: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        self.api_client.get_movies_by_country(country, page, limit).await
    }

    pub async fn search_movies(
        &self,
        query: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        self.api_client.search_movies(query, page, limit).await
    }
}

pub fn default_categories() -> Vec<NamedItem> {
    vec![
        NamedItem { id: "hanh-dong".into(), name: "Hành Động".into(), slug: "hanh-dong".into() },
        NamedItem { id: "tinh-cam".into(), name: "Tình Cảm".into(), slug: "tinh-cam".into() },
        NamedItem { id: "hai-huoc".into(), name: "Hài Hước".into(), slug: "hai-huoc".into() },
        NamedItem { id: "co-trang".into(), name: "Cổ Trang".into(), slug: "co-trang".into() },
        NamedItem { id: "tam-ly".into(), name: "Tâm Lý".into(), slug: "tam-ly".into() },
        NamedItem { id: "hinh-su".into(), name: "Hình Sự".into(), slug: "hinh-su".into() },
        NamedItem { id: "chien-tranh".into(), name: "Chiến Tranh".into(), slug: "chien-tranh".into() },
        NamedItem { id: "the-thao".into(), name: "Thể Thao".into(), slug: "the-thao".into() },
        NamedItem { id: "vo-thuat".into(), name: "Võ Thuật".into(), slug: "vo-thuat".into() },
        NamedItem { id: "vien-tuong".into(), name: "Viễn Tưởng".into(), slug: "vien-tuong".into() },
        NamedItem { id: "phieu-luu".into(), name: "Phiêu Lưu".into(), slug: "phieu-luu".into() },
        NamedItem { id: "khoa-hoc".into(), name: "Khoa Học".into(), slug: "khoa-hoc".into() },
        NamedItem { id: "kinh-di".into(), name: "Kinh Dị".into(), slug: "kinh-di".into() },
        NamedItem { id: "am-nhac".into(), name: "Âm Nhạc".into(), slug: "am-nhac".into() },
        NamedItem { id: "than-thoai".into(), name: "Thần Thoại".into(), slug: "than-thoai".into() },
        NamedItem { id: "tai-lieu".into(), name: "Tài Liệu".into(), slug: "tai-lieu".into() },
        NamedItem { id: "gia-dinh".into(), name: "Gia Đình".into(), slug: "gia-dinh".into() },
        NamedItem { id: "chinh-kich".into(), name: "Chính Kịch".into(), slug: "chinh-kich".into() },
        NamedItem { id: "bi-an".into(), name: "Bí Ẩn".into(), slug: "bi-an".into() },
        NamedItem { id: "hoc-duong".into(), name: "Học Đường".into(), slug: "hoc-duong".into() },
        NamedItem { id: "kinh-dien".into(), name: "Kinh Điển".into(), slug: "kinh-dien".into() },
        NamedItem { id: "phim-18".into(), name: "Phim 18+".into(), slug: "phim-18".into() },
    ]
}

pub fn default_countries() -> Vec<NamedItem> {
    vec![
        NamedItem { id: "viet-nam".into(), name: "Việt Nam".into(), slug: "viet-nam".into() },
        NamedItem { id: "trung-quoc".into(), name: "Trung Quốc".into(), slug: "trung-quoc".into() },
        NamedItem { id: "han-quoc".into(), name: "Hàn Quốc".into(), slug: "han-quoc".into() },
        NamedItem { id: "nhat-ban".into(), name: "Nhật Bản".into(), slug: "nhat-ban".into() },
        NamedItem { id: "thai-lan".into(), name: "Thái Lan".into(), slug: "thai-lan".into() },
        NamedItem { id: "au-my".into(), name: "Âu Mỹ".into(), slug: "au-my".into() },
        NamedItem { id: "dai-loan".into(), name: "Đài Loan".into(), slug: "dai-loan".into() },
        NamedItem { id: "hong-kong".into(), name: "Hồng Kông".into(), slug: "hong-kong".into() },
        NamedItem { id: "an-do".into(), name: "Ấn Độ".into(), slug: "an-do".into() },
        NamedItem { id: "anh".into(), name: "Anh".into(), slug: "anh".into() },
        NamedItem { id: "phap".into(), name: "Pháp".into(), slug: "phap".into() },
        NamedItem { id: "canada".into(), name: "Canada".into(), slug: "canada".into() },
        NamedItem { id: "duc".into(), name: "Đức".into(), slug: "duc".into() },
        NamedItem { id: "tay-ban-nha".into(), name: "Tây Ban Nha".into(), slug: "tay-ban-nha".into() },
    ]
}
