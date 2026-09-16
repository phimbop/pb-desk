use pb_core::models::{FavoriteMovieItem, WatchHistoryItem};
use pb_ipc::*;
use pb_service::{FavoriteService, HistoryService, MovieApiClient, MovieService};
use pb_storage::SqliteStorage;
use std::fs;
use std::sync::Arc;
use tauri::{Manager, State};

pub struct AppState {
    pub movie_service: MovieService,
    pub history_service: HistoryService,
    pub favorite_service: FavoriteService,
}

#[tauri::command]
async fn get_home_data(state: State<'_, AppState>) -> Result<IpcHomeData, String> {
    state
        .movie_service
        .get_home_data()
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_movie_detail(state: State<'_, AppState>, slug: String) -> Result<IpcMovieDetail, String> {
    state
        .movie_service
        .get_movie_detail(&slug)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_movies_by_type(
    state: State<'_, AppState>,
    movie_type: String,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<IpcPaginatedResponse<IpcMovie>, String> {
    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(24);
    state
        .movie_service
        .get_movies_by_type(&movie_type, p, l)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_movies_by_category(
    state: State<'_, AppState>,
    slug: String,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<IpcPaginatedResponse<IpcMovie>, String> {
    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(24);
    state
        .movie_service
        .get_movies_by_category(&slug, p, l)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_movies_by_country(
    state: State<'_, AppState>,
    country: String,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<IpcPaginatedResponse<IpcMovie>, String> {
    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(24);
    state
        .movie_service
        .get_movies_by_country(&country, p, l)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn search_movies(
    state: State<'_, AppState>,
    query: String,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<IpcPaginatedResponse<IpcMovie>, String> {
    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(24);
    state
        .movie_service
        .search_movies(&query, p, l)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_adult_movies(state: State<'_, AppState>) -> Result<Vec<IpcAdultMovieRecord>, String> {
    state
        .movie_service
        .get_adult_movies()
        .await
        .map(|items| items.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_watching_list(
    state: State<'_, AppState>,
    limit: Option<u32>,
) -> Result<Vec<IpcWatchingItem>, String> {
    let l = limit.unwrap_or(10) as usize;
    state
        .movie_service
        .get_watching_list(l)
        .await
        .map(|items| items.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn record_watching_heartbeat(
    state: State<'_, AppState>,
    req: IpcWatchingHeartbeatRequest,
) -> Result<(), String> {
    state
        .movie_service
        .record_watching_heartbeat(&req.movie_id, &req.session_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_watch_history(
    state: State<'_, AppState>,
    limit: Option<u32>,
) -> Result<Vec<IpcWatchHistory>, String> {
    let l = limit.unwrap_or(20);
    state
        .history_service
        .get_history(l)
        .map(|items| items.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_watch_history(state: State<'_, AppState>, req: SaveHistoryRequest) -> Result<(), String> {
    let item = WatchHistoryItem {
        id: None,
        movie_slug: req.movie_slug,
        movie_name: req.movie_name,
        poster_url: req.poster_url,
        episode_name: req.episode_name,
        episode_slug: req.episode_slug,
        link_m3u8: req.link_m3u8,
        duration: req.duration,
        current_time: req.current_time,
        progress_percent: req.progress_percent,
        updated_at: chrono::Utc::now(),
    };
    state
        .history_service
        .save_history(item)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_watch_history(state: State<'_, AppState>, movie_slug: String) -> Result<(), String> {
    state
        .history_service
        .delete_history(&movie_slug)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_watch_history(state: State<'_, AppState>) -> Result<(), String> {
    state
        .history_service
        .clear_history()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_favorites(
    state: State<'_, AppState>,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<IpcPaginatedResponse<IpcFavorite>, String> {
    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(24);
    state
        .favorite_service
        .get_favorites(p, l)
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_favorite(state: State<'_, AppState>, req: ToggleFavoriteRequest) -> Result<bool, String> {
    let item = FavoriteMovieItem {
        id: None,
        movie_slug: req.movie_slug,
        movie_name: req.movie_name,
        origin_name: req.origin_name,
        poster_url: req.poster_url,
        year: req.year,
        quality: req.quality,
        episode_current: req.episode_current,
        created_at: chrono::Utc::now(),
    };
    state
        .favorite_service
        .toggle_favorite(item)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn is_favorite(state: State<'_, AppState>, movie_slug: String) -> Result<bool, String> {
    state
        .favorite_service
        .is_favorite(&movie_slug)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            let _ = fs::create_dir_all(&app_data_dir);
            let db_path = app_data_dir.join("pb_desk.db");

            let storage = Arc::new(
                SqliteStorage::new(&db_path)
                    .or_else(|_| SqliteStorage::new_in_memory())
                    .expect("Failed to initialize storage"),
            );

            let api_client = MovieApiClient::new();
            let movie_service = MovieService::new(api_client, Arc::clone(&storage) as _);
            let history_service = HistoryService::new(Arc::clone(&storage) as _);
            let favorite_service = FavoriteService::new(Arc::clone(&storage) as _);

            app.manage(AppState {
                movie_service,
                history_service,
                favorite_service,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_home_data,
            get_movie_detail,
            get_movies_by_type,
            get_movies_by_category,
            get_movies_by_country,
            search_movies,
            get_watch_history,
            save_watch_history,
            delete_watch_history,
            clear_watch_history,
            get_favorites,
            toggle_favorite,
            is_favorite,
            get_adult_movies,
            get_watching_list,
            record_watching_heartbeat,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
