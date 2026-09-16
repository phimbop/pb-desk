use pb_core::models::{
    AdultMovieRecord, AuthResponse, AuthUser, Episode, FavoriteMovieItem, ForwardRequest,
    ForwardResponse, HomePayload, LeaderboardUser, Leaderboards, Movie, MovieDetail, NamedItem,
    PaginatedResult, ServerData, WatchGenre, WatchHistoryItem, WatchStats, WatchingHeartbeatRequest,
    WatchingItem,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcMovie {
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

impl From<Movie> for IpcMovie {
    fn from(m: Movie) -> Self {
        Self {
            id: m.id,
            name: m.name,
            slug: m.slug,
            origin_name: m.origin_name,
            thumb_url: m.thumb_url,
            poster_url: m.poster_url,
            year: m.year,
            quality: m.quality,
            lang: m.lang,
            time: m.time,
            episode_current: m.episode_current,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcNamedItem {
    pub id: String,
    pub name: String,
    pub slug: String,
}

impl From<NamedItem> for IpcNamedItem {
    fn from(n: NamedItem) -> Self {
        Self {
            id: n.id,
            name: n.name,
            slug: n.slug,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcServerData {
    pub name: String,
    pub slug: String,
    pub filename: Option<String>,
    pub link_embed: Option<String>,
    pub link_m3u8: Option<String>,
}

impl From<ServerData> for IpcServerData {
    fn from(sd: ServerData) -> Self {
        Self {
            name: sd.name,
            slug: sd.slug,
            filename: sd.filename,
            link_embed: sd.link_embed,
            link_m3u8: sd.link_m3u8,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcEpisode {
    pub server_name: String,
    pub server_data: Vec<IpcServerData>,
}

impl From<Episode> for IpcEpisode {
    fn from(ep: Episode) -> Self {
        Self {
            server_name: ep.server_name,
            server_data: ep.server_data.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcMovieDetail {
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
    pub category: Vec<IpcNamedItem>,
    pub country: Vec<IpcNamedItem>,
    pub episodes: Vec<IpcEpisode>,
}

impl From<MovieDetail> for IpcMovieDetail {
    fn from(m: MovieDetail) -> Self {
        Self {
            id: m.id,
            name: m.name,
            slug: m.slug,
            origin_name: m.origin_name,
            content: m.content,
            type_name: m.type_name,
            status: m.status,
            thumb_url: m.thumb_url,
            poster_url: m.poster_url,
            trailer_url: m.trailer_url,
            time: m.time,
            episode_current: m.episode_current,
            episode_total: m.episode_total,
            quality: m.quality,
            lang: m.lang,
            notify: m.notify,
            showtimes: m.showtimes,
            year: m.year,
            view: m.view,
            actor: m.actor,
            director: m.director,
            category: m.category.into_iter().map(Into::into).collect(),
            country: m.country.into_iter().map(Into::into).collect(),
            episodes: m.episodes.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IpcWatchHistory {
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
    pub updated_at: String,
}

impl From<WatchHistoryItem> for IpcWatchHistory {
    fn from(h: WatchHistoryItem) -> Self {
        Self {
            id: h.id,
            movie_slug: h.movie_slug,
            movie_name: h.movie_name,
            poster_url: h.poster_url,
            episode_name: h.episode_name,
            episode_slug: h.episode_slug,
            link_m3u8: h.link_m3u8,
            duration: h.duration,
            current_time: h.current_time,
            progress_percent: h.progress_percent,
            updated_at: h.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcFavorite {
    pub id: Option<i64>,
    pub movie_slug: String,
    pub movie_name: String,
    pub origin_name: String,
    pub poster_url: String,
    pub year: Option<i32>,
    pub quality: Option<String>,
    pub episode_current: Option<String>,
    pub created_at: String,
}

impl From<FavoriteMovieItem> for IpcFavorite {
    fn from(f: FavoriteMovieItem) -> Self {
        Self {
            id: f.id,
            movie_slug: f.movie_slug,
            movie_name: f.movie_name,
            origin_name: f.origin_name,
            poster_url: f.poster_url,
            year: f.year,
            quality: f.quality,
            episode_current: f.episode_current,
            created_at: f.created_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcPaginatedResponse<T> {
    pub items: Vec<T>,
    pub current_page: u32,
    pub total_pages: u32,
    pub total_items: u32,
    pub items_per_page: u32,
}

impl<T, U> From<PaginatedResult<T>> for IpcPaginatedResponse<U>
where
    U: From<T>,
{
    fn from(res: PaginatedResult<T>) -> Self {
        Self {
            items: res.items.into_iter().map(Into::into).collect(),
            current_page: res.current_page,
            total_pages: res.total_pages,
            total_items: res.total_items,
            items_per_page: res.items_per_page,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpcHomeData {
    pub featured_series: Vec<IpcMovie>,
    pub featured_single: Vec<IpcMovie>,
    pub new_updates: Vec<IpcMovie>,
    pub categories: Vec<IpcNamedItem>,
    pub countries: Vec<IpcNamedItem>,
}

impl From<HomePayload> for IpcHomeData {
    fn from(h: HomePayload) -> Self {
        Self {
            featured_series: h.featured_series.into_iter().map(Into::into).collect(),
            featured_single: h.featured_single.into_iter().map(Into::into).collect(),
            new_updates: h.new_updates.into_iter().map(Into::into).collect(),
            categories: h.categories.into_iter().map(Into::into).collect(),
            countries: h.countries.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveHistoryRequest {
    pub movie_slug: String,
    pub movie_name: String,
    pub poster_url: String,
    pub episode_name: String,
    pub episode_slug: String,
    pub link_m3u8: String,
    pub duration: f64,
    pub current_time: f64,
    pub progress_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToggleFavoriteRequest {
    pub movie_slug: String,
    pub movie_name: String,
    pub origin_name: String,
    pub poster_url: String,
    pub year: Option<i32>,
    pub quality: Option<String>,
    pub episode_current: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryRequest {
    pub slug: String,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> IpcResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IpcAdultMovieRecord {
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

impl From<AdultMovieRecord> for IpcAdultMovieRecord {
    fn from(r: AdultMovieRecord) -> Self {
        Self {
            id: r.id,
            is_18: r.is_18,
            movie: r.movie,
            views: r.views,
            watching: r.watching,
            updated_at: r.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IpcWatchingItem {
    pub movie: serde_json::Value,
    pub watching: u64,
}

impl From<WatchingItem> for IpcWatchingItem {
    fn from(w: WatchingItem) -> Self {
        Self {
            movie: w.movie,
            watching: w.watching,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcWatchingHeartbeatRequest {
    pub movie_id: String,
    pub session_id: String,
}

impl From<IpcWatchingHeartbeatRequest> for WatchingHeartbeatRequest {
    fn from(r: IpcWatchingHeartbeatRequest) -> Self {
        Self {
            movie_id: r.movie_id,
            session_id: r.session_id,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IpcLeaderboardUser {
    pub user_id: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub count: u64,
    #[serde(default)]
    pub hours: u64,
    pub total_watch_hours: u64,
}

impl From<LeaderboardUser> for IpcLeaderboardUser {
    fn from(u: LeaderboardUser) -> Self {
        Self {
            user_id: u.user_id,
            username: u.username,
            avatar_url: u.avatar_url,
            count: u.count,
            hours: u.hours,
            total_watch_hours: u.total_watch_hours,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct IpcLeaderboards {
    pub top_watchers: Vec<IpcLeaderboardUser>,
    pub top_reviewers: Vec<IpcLeaderboardUser>,
    pub top_commenters: Vec<IpcLeaderboardUser>,
}

impl From<Leaderboards> for IpcLeaderboards {
    fn from(l: Leaderboards) -> Self {
        Self {
            top_watchers: l.top_watchers.into_iter().map(Into::into).collect(),
            top_reviewers: l.top_reviewers.into_iter().map(Into::into).collect(),
            top_commenters: l.top_commenters.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IpcAuthUser {
    pub id: String,
    pub email: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub created_at: Option<String>,
}

impl From<AuthUser> for IpcAuthUser {
    fn from(u: AuthUser) -> Self {
        Self {
            id: u.id,
            email: u.email,
            username: u.username,
            avatar_url: u.avatar_url,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IpcAuthResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user: Option<IpcAuthUser>,
    pub error: Option<String>,
}

impl From<AuthResponse> for IpcAuthResponse {
    fn from(r: AuthResponse) -> Self {
        Self {
            success: r.success,
            token: r.token,
            user: r.user.map(Into::into),
            error: r.error,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignupRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IpcWatchGenre {
    pub name: String,
    pub count: u32,
}

impl From<WatchGenre> for IpcWatchGenre {
    fn from(g: WatchGenre) -> Self {
        Self {
            name: g.name,
            count: g.count,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct IpcWatchStats {
    pub total_movies: u32,
    pub total_hours: u32,
    pub top_genres: Vec<IpcWatchGenre>,
    pub ratings_count: u32,
}

impl From<WatchStats> for IpcWatchStats {
    fn from(s: WatchStats) -> Self {
        Self {
            total_movies: s.total_movies,
            total_hours: s.total_hours,
            top_genres: s.top_genres.into_iter().map(Into::into).collect(),
            ratings_count: s.ratings_count,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcForwardRequest {
    pub method: String,
    pub path: String,
    pub body: Option<serde_json::Value>,
    pub token: Option<String>,
}

impl From<ForwardRequest> for IpcForwardRequest {
    fn from(r: ForwardRequest) -> Self {
        Self {
            method: r.method,
            path: r.path,
            body: r.body,
            token: r.token,
        }
    }
}

impl From<IpcForwardRequest> for ForwardRequest {
    fn from(r: IpcForwardRequest) -> Self {
        Self {
            method: r.method,
            path: r.path,
            body: r.body,
            token: r.token,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcForwardResponse {
    pub status: u16,
    pub body: serde_json::Value,
    pub session_token: Option<String>,
}

impl From<ForwardResponse> for IpcForwardResponse {
    fn from(r: ForwardResponse) -> Self {
        Self {
            status: r.status,
            body: r.body,
            session_token: r.session_token,
        }
    }
}

impl From<IpcForwardResponse> for ForwardResponse {
    fn from(r: IpcForwardResponse) -> Self {
        Self {
            status: r.status,
            body: r.body,
            session_token: r.session_token,
        }
    }
}



