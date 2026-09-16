pub mod tray;

use pb_core::models::{FavoriteMovieItem, WatchHistoryItem};
use pb_ipc::*;
use pb_service::{
    AuthService, FavoriteService, HistoryService, MovieApiClient, MovieService, NotificationWorker,
    SurrealClient,
};
use pb_storage::SqliteStorage;
use std::fs;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;

pub struct AppState {
    pub movie_service: MovieService,
    pub history_service: HistoryService,
    pub favorite_service: FavoriteService,
    pub auth_service: AuthService,
    pub surreal_client: SurrealClient,
    pub storage: Arc<SqliteStorage>,
    pub notification_worker: NotificationWorker,
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
async fn get_leaderboards(state: State<'_, AppState>) -> Result<IpcLeaderboards, String> {
    state
        .movie_service
        .get_leaderboards()
        .await
        .map(Into::into)
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

#[tauri::command]
async fn auth_login(
    state: State<'_, AppState>,
    req: LoginRequest,
) -> Result<IpcAuthResponse, String> {
    state
        .auth_service
        .login(&req.email, &req.password)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn auth_signup(
    state: State<'_, AppState>,
    req: SignupRequest,
) -> Result<IpcAuthResponse, String> {
    state
        .auth_service
        .signup(&req.email, &req.username, &req.password)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn auth_get_me(
    state: State<'_, AppState>,
    token: String,
) -> Result<IpcAuthUser, String> {
    state
        .auth_service
        .get_me(&token)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn auth_logout(
    state: State<'_, AppState>,
    token: Option<String>,
) -> Result<(), String> {
    state
        .auth_service
        .logout(token.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn forward_api(
    state: State<'_, AppState>,
    req: IpcForwardRequest,
) -> Result<IpcForwardResponse, String> {
    state
        .auth_service
        .forward_request(req.into())
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_user_watch_stats(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<IpcWatchStats, String> {
    state
        .surreal_client
        .get_user_watch_stats(&user_id)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_settings(state: State<'_, AppState>) -> Result<IpcAppSettings, String> {
    state
        .storage
        .get_settings()
        .map(Into::into)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_app_settings(state: State<'_, AppState>, settings: IpcAppSettings) -> Result<(), String> {
    state
        .storage
        .save_settings(&settings.into())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn check_for_movie_updates(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<Vec<IpcMovieUpdateEvent>, String> {
    trigger_manual_check(&app, &state).await
}

pub async fn trigger_manual_check(
    app: &tauri::AppHandle,
    state: &AppState,
) -> Result<Vec<IpcMovieUpdateEvent>, String> {
    let updates = state
        .notification_worker
        .check_for_updates()
        .await
        .map_err(|e| e.to_string())?;

    for ev in &updates {
        let title = if ev.is_new_movie {
            "🎬 PHIMBOP - Phim mới cập nhật!".to_string()
        } else {
            format!("🔥 Tập mới: {}", ev.movie_name)
        };
        let body = if let Some(ref ep) = ev.episode {
            format!("{} vừa cập nhật {}!", ev.movie_name, ep)
        } else {
            format!("{} đã có mặt trên PHIMBOP!", ev.movie_name)
        };

        let _ = app
            .notification()
            .builder()
            .title(&title)
            .body(&body)
            .show();

        let ipc_ev: IpcMovieUpdateEvent = ev.clone().into();
        let _ = app.emit("movie-update", &ipc_ev);
    }

    Ok(updates.into_iter().map(Into::into).collect())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if let Some(state) = window.try_state::<AppState>() {
                    let settings = state.storage.get_settings().unwrap_or_default();
                    if settings.minimize_to_tray {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
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
            let movie_service = MovieService::new(api_client.clone(), Arc::clone(&storage) as _);
            let history_service = HistoryService::new(Arc::clone(&storage) as _);
            let favorite_service = FavoriteService::new(Arc::clone(&storage) as _);
            let surreal_client = SurrealClient::new();
            let auth_service = AuthService::new(surreal_client.clone());
            let notification_worker = NotificationWorker::new(Arc::clone(&storage), api_client);

            // Setup System Tray
            let _ = tray::setup_tray(app.handle());

            // Check if launched with --minimized flag (e.g. from Autostart)
            let args: Vec<String> = std::env::args().collect();
            if args.iter().any(|a| a == "--minimized") {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

            // Spawn background polling loop
            let app_handle = app.handle().clone();
            let storage_for_loop = Arc::clone(&storage);
            let worker_for_loop = notification_worker.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(15)).await;
                loop {
                    let settings = storage_for_loop.get_settings().unwrap_or_default();
                    if settings.notify_new_movies {
                        if let Ok(updates) = worker_for_loop.check_for_updates().await {
                            for ev in updates {
                                let title = if ev.is_new_movie {
                                    "🎬 PHIMBOP - Phim mới cập nhật!".to_string()
                                } else {
                                    format!("🔥 Tập mới: {}", ev.movie_name)
                                };
                                let body = if let Some(ref ep) = ev.episode {
                                    format!("{} vừa cập nhật {}!", ev.movie_name, ep)
                                } else {
                                    format!("{} đã có mặt trên PHIMBOP!", ev.movie_name)
                                };

                                let _ = app_handle
                                    .notification()
                                    .builder()
                                    .title(&title)
                                    .body(&body)
                                    .show();

                                let ipc_ev: IpcMovieUpdateEvent = ev.into();
                                let _ = app_handle.emit("movie-update", &ipc_ev);
                            }
                        }
                    }

                    let interval_mins = storage_for_loop
                        .get_settings()
                        .map(|s| s.check_interval_mins)
                        .unwrap_or(15)
                        .max(5);
                    tokio::time::sleep(tokio::time::Duration::from_secs(interval_mins as u64 * 60)).await;
                }
            });

            app.manage(AppState {
                movie_service,
                history_service,
                favorite_service,
                auth_service,
                surreal_client,
                storage,
                notification_worker,
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
            get_leaderboards,
            get_watching_list,
            record_watching_heartbeat,
            auth_login,
            auth_signup,
            auth_get_me,
            auth_logout,
            forward_api,
            get_user_watch_stats,
            get_app_settings,
            save_app_settings,
            check_for_movie_updates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
