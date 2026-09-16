use pb_core::error::{PbError, PbResult};
use pb_core::models::{Episode, Movie, MovieDetail, NamedItem, PaginatedResult, ServerData};
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;

const DOMAIN_KKPHIM: &str = "https://phimapi.com";

#[derive(Clone)]
pub struct MovieApiClient {
    client: Client,
    base_url: String,
}

#[derive(Deserialize, Debug)]
struct KkRawItem {
    #[serde(rename = "_id", default)]
    id: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    slug: Option<String>,
    #[serde(default)]
    origin_name: Option<String>,
    #[serde(default)]
    thumb_url: Option<String>,
    #[serde(default)]
    poster_url: Option<String>,
    #[serde(default)]
    year: Option<serde_json::Value>,
    #[serde(default)]
    quality: Option<String>,
    #[serde(default)]
    lang: Option<String>,
    #[serde(default)]
    time: Option<serde_json::Value>,
    #[serde(default)]
    episode_current: Option<serde_json::Value>,
}

#[derive(Deserialize, Debug)]
struct KkPagination {
    #[serde(rename = "totalItems", default)]
    total_items: Option<u32>,
    #[serde(rename = "totalItemsPerPage", default)]
    total_items_per_page: Option<u32>,
    #[serde(rename = "currentPage", default)]
    current_page: Option<u32>,
    #[serde(rename = "totalPages", default)]
    total_pages: Option<u32>,
}

#[derive(Deserialize, Debug)]
struct KkListParams {
    #[serde(default)]
    pagination: Option<KkPagination>,
}

#[derive(Deserialize, Debug)]
struct KkV1ListResponse {
    #[serde(default)]
    data: Option<KkV1ListData>,
}

#[derive(Deserialize, Debug)]
struct KkV1ListData {
    #[serde(default)]
    items: Vec<KkRawItem>,
    #[serde(default)]
    params: Option<KkListParams>,
}

#[derive(Deserialize, Debug)]
struct KkNewUpdatesResponse {
    #[serde(default)]
    items: Vec<KkRawItem>,
    #[serde(default)]
    pagination: Option<KkPagination>,
}

#[derive(Deserialize, Debug)]
struct KkNamedItem {
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    slug: Option<String>,
}

#[derive(Deserialize, Debug)]
struct KkServerData {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    slug: Option<String>,
    #[serde(default)]
    filename: Option<String>,
    #[serde(default)]
    link_embed: Option<String>,
    #[serde(default)]
    link_m3u8: Option<String>,
}

#[derive(Deserialize, Debug)]
struct KkEpisode {
    #[serde(default)]
    server_name: Option<String>,
    #[serde(default)]
    server_data: Vec<KkServerData>,
}

#[derive(Deserialize, Debug)]
struct KkMovieRawDetail {
    #[serde(rename = "_id", default)]
    id: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    slug: Option<String>,
    #[serde(default)]
    origin_name: Option<String>,
    #[serde(default)]
    content: Option<String>,
    #[serde(rename = "type", default)]
    type_name: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    thumb_url: Option<String>,
    #[serde(default)]
    poster_url: Option<String>,
    #[serde(default)]
    trailer_url: Option<String>,
    #[serde(default)]
    time: Option<serde_json::Value>,
    #[serde(default)]
    episode_current: Option<serde_json::Value>,
    #[serde(default)]
    episode_total: Option<serde_json::Value>,
    #[serde(default)]
    quality: Option<String>,
    #[serde(default)]
    lang: Option<String>,
    #[serde(default)]
    notify: Option<String>,
    #[serde(default)]
    showtimes: Option<String>,
    #[serde(default)]
    year: Option<serde_json::Value>,
    #[serde(default)]
    view: Option<serde_json::Value>,
    #[serde(default)]
    actor: Vec<String>,
    #[serde(default)]
    director: Vec<String>,
    #[serde(default)]
    category: Vec<KkNamedItem>,
    #[serde(default)]
    country: Vec<KkNamedItem>,
}

#[derive(Deserialize, Debug)]
struct KkDetailResponse {
    #[serde(default)]
    movie: Option<KkMovieRawDetail>,
    #[serde(default)]
    episodes: Vec<KkEpisode>,
}

impl Default for MovieApiClient {
    fn default() -> Self {
        Self::new()
    }
}

impl MovieApiClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(12))
            .build()
            .unwrap_or_default();

        Self {
            client,
            base_url: DOMAIN_KKPHIM.to_string(),
        }
    }

    fn normalize_image_url(url: Option<&str>) -> String {
        let u = match url {
            Some(s) => s.trim(),
            None => "",
        };
        if u.is_empty() {
            return String::new();
        }
        if u.starts_with("http://") || u.starts_with("https://") {
            u.to_string()
        } else {
            format!("https://phimimg.com/{}", u)
        }
    }

    fn value_to_string(v: Option<serde_json::Value>) -> Option<String> {
        match v {
            Some(serde_json::Value::String(s)) => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            }
            Some(serde_json::Value::Number(n)) => Some(n.to_string()),
            _ => None,
        }
    }

    fn value_to_i32(v: Option<serde_json::Value>) -> Option<i32> {
        match v {
            Some(serde_json::Value::Number(n)) => n.as_i64().map(|x| x as i32),
            Some(serde_json::Value::String(s)) => s.trim().parse::<i32>().ok(),
            _ => None,
        }
    }

    fn value_to_i64(v: Option<serde_json::Value>) -> Option<i64> {
        match v {
            Some(serde_json::Value::Number(n)) => n.as_i64(),
            Some(serde_json::Value::String(s)) => s.trim().parse::<i64>().ok(),
            _ => None,
        }
    }

    fn map_raw_item(raw: KkRawItem) -> Movie {
        Movie {
            id: raw.id.unwrap_or_default(),
            name: raw.name.unwrap_or_default(),
            slug: raw.slug.unwrap_or_default(),
            origin_name: raw.origin_name.unwrap_or_default(),
            thumb_url: Self::normalize_image_url(raw.thumb_url.as_deref()),
            poster_url: Self::normalize_image_url(raw.poster_url.as_deref()),
            year: Self::value_to_i32(raw.year),
            quality: raw.quality,
            lang: raw.lang,
            time: Self::value_to_string(raw.time),
            episode_current: Self::value_to_string(raw.episode_current),
        }
    }

    pub async fn get_new_updates(&self, page: u32) -> PbResult<PaginatedResult<Movie>> {
        let url = format!("{}/danh-sach/phim-moi-cap-nhat?page={}", self.base_url, page);
        let resp = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("HTTP status {}", resp.status())));
        }

        let text = resp
            .text()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        let body: KkNewUpdatesResponse = serde_json::from_str(&text)
            .map_err(|e| PbError::Serialization(e.to_string()))?;

        let items = body.items.into_iter().map(Self::map_raw_item).collect();
        let pagination = body.pagination.unwrap_or(KkPagination {
            total_items: Some(0),
            total_items_per_page: Some(24),
            current_page: Some(page),
            total_pages: Some(1),
        });

        Ok(PaginatedResult {
            items,
            current_page: pagination.current_page.unwrap_or(page),
            total_pages: pagination.total_pages.unwrap_or(1),
            total_items: pagination.total_items.unwrap_or(0),
            items_per_page: pagination.total_items_per_page.unwrap_or(24),
        })
    }

    pub async fn get_movies_by_list(
        &self,
        danh_sach: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        if danh_sach == "phim-moi-cap-nhat" || danh_sach == "phim-moi" {
            return self.get_new_updates(page).await;
        }
        let url = format!(
            "{}/v1/api/danh-sach/{}?page={}&limit={}",
            self.base_url, danh_sach, page, limit
        );
        self.fetch_v1_list(&url, page, limit).await
    }

    pub async fn get_movies_by_category(
        &self,
        category: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        let url = format!(
            "{}/v1/api/the-loai/{}?page={}&limit={}",
            self.base_url, category, page, limit
        );
        self.fetch_v1_list(&url, page, limit).await
    }

    pub async fn get_movies_by_country(
        &self,
        country: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        let url = format!(
            "{}/v1/api/quoc-gia/{}?page={}&limit={}",
            self.base_url, country, page, limit
        );
        self.fetch_v1_list(&url, page, limit).await
    }

    pub async fn search_movies(
        &self,
        query: &str,
        page: u32,
        limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        let encoded = urlencoding_simple(query);
        let url = format!(
            "{}/v1/api/tim-kiem?keyword={}&page={}&limit={}",
            self.base_url, encoded, page, limit
        );
        self.fetch_v1_list(&url, page, limit).await
    }

    async fn fetch_v1_list(
        &self,
        url: &str,
        fallback_page: u32,
        fallback_limit: u32,
    ) -> PbResult<PaginatedResult<Movie>> {
        let resp = self
            .client
            .get(url)
            .send()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("HTTP status {}", resp.status())));
        }

        let text = resp
            .text()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        let body: KkV1ListResponse = serde_json::from_str(&text)
            .map_err(|e| PbError::Serialization(format!("{}: {}", e, &text[..text.len().min(250)])))?;

        let data = body.data.unwrap_or(KkV1ListData {
            items: Vec::new(),
            params: None,
        });

        let pagination = data
            .params
            .and_then(|p| p.pagination)
            .unwrap_or(KkPagination {
                total_items: Some(data.items.len() as u32),
                total_items_per_page: Some(fallback_limit),
                current_page: Some(fallback_page),
                total_pages: Some(1),
            });

        let items = data.items.into_iter().map(Self::map_raw_item).collect();

        Ok(PaginatedResult {
            items,
            current_page: pagination.current_page.unwrap_or(fallback_page),
            total_pages: pagination.total_pages.unwrap_or(1),
            total_items: pagination.total_items.unwrap_or(0),
            items_per_page: pagination.total_items_per_page.unwrap_or(fallback_limit),
        })
    }

    pub async fn get_movie_detail(&self, slug: &str) -> PbResult<MovieDetail> {
        let url = format!("{}/phim/{}", self.base_url, slug);
        let resp = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("HTTP status {}", resp.status())));
        }

        let text = resp
            .text()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        let body: KkDetailResponse = serde_json::from_str(&text)
            .map_err(|e| PbError::Serialization(format!("{}: {}", e, &text[..text.len().min(250)])))?;

        let raw = body
            .movie
            .ok_or_else(|| PbError::NotFound(format!("Movie not found: {}", slug)))?;

        let episodes = body
            .episodes
            .into_iter()
            .map(|ep| Episode {
                server_name: ep.server_name.unwrap_or_default(),
                server_data: ep
                    .server_data
                    .into_iter()
                    .map(|sd| ServerData {
                        name: sd.name.unwrap_or_default(),
                        slug: sd.slug.unwrap_or_default(),
                        filename: sd.filename,
                        link_embed: sd.link_embed,
                        link_m3u8: sd.link_m3u8,
                    })
                    .collect(),
            })
            .collect();

        let category = raw
            .category
            .into_iter()
            .map(|c| NamedItem {
                id: c.id.unwrap_or_default(),
                name: c.name.unwrap_or_default(),
                slug: c.slug.unwrap_or_default(),
            })
            .collect();

        let country = raw
            .country
            .into_iter()
            .map(|c| NamedItem {
                id: c.id.unwrap_or_default(),
                name: c.name.unwrap_or_default(),
                slug: c.slug.unwrap_or_default(),
            })
            .collect();

        Ok(MovieDetail {
            id: raw.id.unwrap_or_default(),
            name: raw.name.unwrap_or_default(),
            slug: raw.slug.unwrap_or_default(),
            origin_name: raw.origin_name.unwrap_or_default(),
            content: raw.content.unwrap_or_default(),
            type_name: raw.type_name.unwrap_or_default(),
            status: raw.status.unwrap_or_default(),
            thumb_url: Self::normalize_image_url(raw.thumb_url.as_deref()),
            poster_url: Self::normalize_image_url(raw.poster_url.as_deref()),
            trailer_url: raw.trailer_url,
            time: Self::value_to_string(raw.time),
            episode_current: Self::value_to_string(raw.episode_current),
            episode_total: Self::value_to_string(raw.episode_total),
            quality: raw.quality,
            lang: raw.lang,
            notify: raw.notify,
            showtimes: raw.showtimes,
            year: Self::value_to_i32(raw.year),
            view: Self::value_to_i64(raw.view),
            actor: raw.actor,
            director: raw.director,
            category,
            country,
            episodes,
        })
    }
}

fn urlencoding_simple(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || b == b'-' || b == b'_' || b == b'.' || b == b'~' {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{:02X}", b));
        }
    }
    out
}
