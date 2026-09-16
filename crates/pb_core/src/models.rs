use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Movie {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub origin_name: String,
    pub thumb_url: String,
    pub poster_url: String,
    pub year: Option<i32>,
    pub quality: Option<String>,
    pub lang: Option<String>,
    pub time: Option<String>,
    pub episode_current: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NamedItem {
    pub id: String,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServerData {
    pub name: String,
    pub slug: String,
    pub filename: Option<String>,
    pub link_embed: Option<String>,
    pub link_m3u8: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Episode {
    pub server_name: String,
    pub server_data: Vec<ServerData>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MovieDetail {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub origin_name: String,
    pub content: String,
    pub type_name: String,
    pub status: String,
    pub thumb_url: String,
    pub poster_url: String,
    pub trailer_url: Option<String>,
    pub time: Option<String>,
    pub episode_current: Option<String>,
    pub episode_total: Option<String>,
    pub quality: Option<String>,
    pub lang: Option<String>,
    pub notify: Option<String>,
    pub showtimes: Option<String>,
    pub year: Option<i32>,
    pub view: Option<i64>,
    pub actor: Vec<String>,
    pub director: Vec<String>,
    pub category: Vec<NamedItem>,
    pub country: Vec<NamedItem>,
    pub episodes: Vec<Episode>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WatchHistoryItem {
    pub id: Option<i64>,
    pub movie_slug: String,
    pub movie_name: String,
    pub poster_url: String,
    pub episode_name: String,
    pub episode_slug: String,
    pub link_m3u8: String,
    pub duration: f64,
    pub current_time: f64,
    pub progress_percent: f64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FavoriteMovieItem {
    pub id: Option<i64>,
    pub movie_slug: String,
    pub movie_name: String,
    pub origin_name: String,
    pub poster_url: String,
    pub year: Option<i32>,
    pub quality: Option<String>,
    pub episode_current: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub current_page: u32,
    pub total_pages: u32,
    pub total_items: u32,
    pub items_per_page: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HomePayload {
    pub featured_series: Vec<Movie>,
    pub featured_single: Vec<Movie>,
    pub new_updates: Vec<Movie>,
    pub categories: Vec<NamedItem>,
    pub countries: Vec<NamedItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AdultMovieRecord {
    pub id: String,
    #[serde(default)]
    pub is_18: Option<bool>,
    #[serde(default)]
    pub movie: serde_json::Value,
    #[serde(default)]
    pub views: Option<u64>,
    #[serde(default)]
    pub watching: Option<u64>,
    #[serde(rename = "updatedAt", default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WatchingItem {
    pub movie: serde_json::Value,
    pub watching: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchingHeartbeatRequest {
    pub movie_id: String,
    pub session_id: String,
}
