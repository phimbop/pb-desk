use crate::error::PbResult;
use crate::models::{FavoriteMovieItem, MovieDetail, PaginatedResult, WatchHistoryItem};

pub trait HistoryRepository: Send + Sync {
    fn get_history(&self, limit: u32) -> PbResult<Vec<WatchHistoryItem>>;
    fn save_history(&self, item: WatchHistoryItem) -> PbResult<()>;
    fn delete_history(&self, movie_slug: &str) -> PbResult<()>;
    fn clear_history(&self) -> PbResult<()>;
}

pub trait FavoriteRepository: Send + Sync {
    fn get_favorites(&self, page: u32, limit: u32) -> PbResult<PaginatedResult<FavoriteMovieItem>>;
    fn add_favorite(&self, item: FavoriteMovieItem) -> PbResult<()>;
    fn remove_favorite(&self, movie_slug: &str) -> PbResult<()>;
    fn is_favorite(&self, movie_slug: &str) -> PbResult<bool>;
}

pub trait MovieCacheRepository: Send + Sync {
    fn get_cached_movie(&self, slug: &str) -> PbResult<Option<MovieDetail>>;
    fn set_cached_movie(&self, movie: &MovieDetail, ttl_secs: u64) -> PbResult<()>;
    fn get_cached_json(&self, key: &str) -> PbResult<Option<String>>;
    fn set_cached_json(&self, key: &str, data: &str, ttl_secs: u64) -> PbResult<()>;
}
