use pb_core::models::{FavoriteMovieItem, WatchHistoryItem};
use pb_ipc::*;
use pb_service::{
    AuthService, FavoriteService, HistoryService, MovieApiClient, MovieService, NotificationWorker,
    SurrealClient,
};
use pb_storage::SqliteStorage;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::env;
use std::fs;
use std::io::{self, BufRead, Write};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::mpsc;

#[derive(Debug, Deserialize)]
struct Request {
    id: Value,
    method: String,
    #[serde(default)]
    params: Value,
}

#[derive(Debug, Serialize)]
struct Response {
    id: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
struct OutgoingEvent {
    #[serde(rename = "type")]
    msg_type: &'static str,
    event: String,
    data: Value,
}

pub struct AppState {
    pub movie_service: MovieService,
    pub history_service: HistoryService,
    pub favorite_service: FavoriteService,
    pub auth_service: AuthService,
    pub surreal_client: SurrealClient,
    pub storage: Arc<SqliteStorage>,
    pub notification_worker: NotificationWorker,
}

async fn handle_request(state: &AppState, req: Request) -> Response {
    let id = req.id;
    let res = execute_method(state, &req.method, req.params).await;
    match res {
        Ok(val) => Response {
            id,
            result: Some(val),
            error: None,
        },
        Err(e) => Response {
            id,
            result: None,
            error: Some(e),
        },
    }
}

async fn execute_method(state: &AppState, method: &str, params: Value) -> Result<Value, String> {
    match method {
        "ping" => Ok(serde_json::json!("pong")),

        "set_api_domain" => {
            let domain = params
                .get("domain")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing domain parameter".to_string())?;
            state.movie_service.set_api_domain(domain);
            state.auth_service.set_api_domain(domain);
            Ok(serde_json::json!({ "success": true, "domain": domain }))
        }

        "get_home_data" => {
            let data: IpcHomeData = state
                .movie_service
                .get_home_data()
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(data).map_err(|e| e.to_string())
        }

        "get_movie_detail" => {
            let slug = params
                .get("slug")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing slug parameter".to_string())?;
            let detail: IpcMovieDetail = state
                .movie_service
                .get_movie_detail(slug)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(detail).map_err(|e| e.to_string())
        }

        "get_movies_by_type" => {
            let movie_type = params
                .get("movie_type")
                .or_else(|| params.get("movieType"))
                .and_then(|v| v.as_str())
                .unwrap_or("phim-bo");
            let page = params.get("page").and_then(|v| v.as_u64()).unwrap_or(1) as u32;
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(24) as u32;

            let res: IpcPaginatedResponse<IpcMovie> = state
                .movie_service
                .get_movies_by_type(movie_type, page, limit)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(res).map_err(|e| e.to_string())
        }

        "get_movies_by_category" => {
            let slug = params
                .get("slug")
                .and_then(|v| v.as_str())
                .unwrap_or("hanh-dong");
            let page = params.get("page").and_then(|v| v.as_u64()).unwrap_or(1) as u32;
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(24) as u32;

            let res: IpcPaginatedResponse<IpcMovie> = state
                .movie_service
                .get_movies_by_category(slug, page, limit)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(res).map_err(|e| e.to_string())
        }

        "get_movies_by_country" => {
            let country = params
                .get("country")
                .and_then(|v| v.as_str())
                .unwrap_or("viet-nam");
            let page = params.get("page").and_then(|v| v.as_u64()).unwrap_or(1) as u32;
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(24) as u32;

            let res: IpcPaginatedResponse<IpcMovie> = state
                .movie_service
                .get_movies_by_country(country, page, limit)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(res).map_err(|e| e.to_string())
        }

        "search_movies" => {
            let query = params
                .get("query")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let page = params.get("page").and_then(|v| v.as_u64()).unwrap_or(1) as u32;
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(24) as u32;

            let res: IpcPaginatedResponse<IpcMovie> = state
                .movie_service
                .search_movies(query, page, limit)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(res).map_err(|e| e.to_string())
        }

        "get_adult_movies" => {
            let items: Vec<IpcAdultMovieRecord> = state
                .movie_service
                .get_adult_movies()
                .await
                .map(|items| items.into_iter().map(Into::into).collect())
                .map_err(|e| e.to_string())?;
            serde_json::to_value(items).map_err(|e| e.to_string())
        }

        "get_leaderboards" => {
            let boards: IpcLeaderboards = state
                .movie_service
                .get_leaderboards()
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(boards).map_err(|e| e.to_string())
        }

        "get_watching_list" => {
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(10) as usize;
            let items: Vec<IpcWatchingItem> = state
                .movie_service
                .get_watching_list(limit)
                .await
                .map(|items| items.into_iter().map(Into::into).collect())
                .map_err(|e| e.to_string())?;
            serde_json::to_value(items).map_err(|e| e.to_string())
        }

        "record_watching_heartbeat" => {
            let req_val = params.get("req").unwrap_or(&params);
            let req: IpcWatchingHeartbeatRequest =
                serde_json::from_value(req_val.clone()).map_err(|e| e.to_string())?;
            state
                .movie_service
                .record_watching_heartbeat(&req.movie_id, &req.session_id)
                .await
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "get_watch_history" => {
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(20) as u32;
            let items: Vec<IpcWatchHistory> = state
                .history_service
                .get_history(limit)
                .map(|items| items.into_iter().map(Into::into).collect())
                .map_err(|e| e.to_string())?;
            serde_json::to_value(items).map_err(|e| e.to_string())
        }

        "save_watch_history" => {
            let req_val = params.get("req").unwrap_or(&params);
            let req: SaveHistoryRequest =
                serde_json::from_value(req_val.clone()).map_err(|e| e.to_string())?;
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
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "delete_watch_history" => {
            let movie_slug = params
                .get("movie_slug")
                .or_else(|| params.get("movieSlug"))
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing movie_slug parameter".to_string())?;
            state
                .history_service
                .delete_history(movie_slug)
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "clear_watch_history" => {
            state
                .history_service
                .clear_history()
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "get_favorites" => {
            let page = params.get("page").and_then(|v| v.as_u64()).unwrap_or(1) as u32;
            let limit = params.get("limit").and_then(|v| v.as_u64()).unwrap_or(24) as u32;

            let res: IpcPaginatedResponse<IpcFavorite> = state
                .favorite_service
                .get_favorites(page, limit)
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(res).map_err(|e| e.to_string())
        }

        "toggle_favorite" => {
            let req_val = params.get("req").unwrap_or(&params);
            let req: ToggleFavoriteRequest =
                serde_json::from_value(req_val.clone()).map_err(|e| e.to_string())?;
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
            let is_fav = state
                .favorite_service
                .toggle_favorite(item)
                .map_err(|e| e.to_string())?;
            Ok(Value::Bool(is_fav))
        }

        "is_favorite" => {
            let movie_slug = params
                .get("movie_slug")
                .or_else(|| params.get("movieSlug"))
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing movie_slug parameter".to_string())?;
            let is_fav = state
                .favorite_service
                .is_favorite(movie_slug)
                .map_err(|e| e.to_string())?;
            Ok(Value::Bool(is_fav))
        }

        "auth_login" => {
            let req_val = params.get("req").unwrap_or(&params);
            let req: LoginRequest =
                serde_json::from_value(req_val.clone()).map_err(|e| e.to_string())?;
            let resp: IpcAuthResponse = state
                .auth_service
                .login(&req.email, &req.password)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(resp).map_err(|e| e.to_string())
        }

        "auth_signup" => {
            let req_val = params.get("req").unwrap_or(&params);
            let req: SignupRequest =
                serde_json::from_value(req_val.clone()).map_err(|e| e.to_string())?;
            let resp: IpcAuthResponse = state
                .auth_service
                .signup(&req.email, &req.username, &req.password)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(resp).map_err(|e| e.to_string())
        }

        "auth_get_me" => {
            let token = params
                .get("token")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing token parameter".to_string())?;
            let user: IpcAuthUser = state
                .auth_service
                .get_me(token)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(user).map_err(|e| e.to_string())
        }

        "auth_logout" => {
            let token = params.get("token").and_then(|v| v.as_str());
            state
                .auth_service
                .logout(token)
                .await
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "forward_api" => {
            let req_val = params.get("req").unwrap_or(&params);
            let req: IpcForwardRequest =
                serde_json::from_value(req_val.clone()).map_err(|e| e.to_string())?;
            let resp: IpcForwardResponse = state
                .auth_service
                .forward_request(req.into())
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(resp).map_err(|e| e.to_string())
        }

        "get_user_watch_stats" => {
            let user_id = params
                .get("user_id")
                .or_else(|| params.get("userId"))
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing user_id parameter".to_string())?;
            let stats: IpcWatchStats = state
                .surreal_client
                .get_user_watch_stats(user_id)
                .await
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(stats).map_err(|e| e.to_string())
        }

        "get_app_settings" => {
            let settings: IpcAppSettings = state
                .storage
                .get_settings()
                .map(Into::into)
                .map_err(|e| e.to_string())?;
            serde_json::to_value(settings).map_err(|e| e.to_string())
        }

        "save_app_settings" => {
            let settings_val = params.get("settings").unwrap_or(&params);
            let settings: IpcAppSettings =
                serde_json::from_value(settings_val.clone()).map_err(|e| e.to_string())?;
            state
                .storage
                .save_settings(&settings.into())
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "check_for_movie_updates" => {
            let updates = state
                .notification_worker
                .check_for_updates()
                .await
                .map_err(|e| e.to_string())?;
            let ipc_updates: Vec<IpcMovieUpdateEvent> =
                updates.into_iter().map(Into::into).collect();
            serde_json::to_value(ipc_updates).map_err(|e| e.to_string())
        }

        "get_installation_id" => {
            let id = state
                .storage
                .get_or_create_installation_id()
                .map_err(|e| e.to_string())?;
            Ok(Value::String(id))
        }

        unknown => Err(format!("Unknown command method: {}", unknown)),
    }
}

fn resolve_data_dir() -> PathBuf {
    let args: Vec<String> = env::args().collect();
    let mut data_dir: Option<PathBuf> = None;

    let mut i = 1;
    while i < args.len() {
        if args[i] == "--data-dir" && i + 1 < args.len() {
            data_dir = Some(PathBuf::from(&args[i + 1]));
            break;
        }
        i += 1;
    }

    data_dir.unwrap_or_else(|| {
        if let Ok(config_home) = env::var("XDG_CONFIG_HOME") {
            PathBuf::from(config_home).join("com.phimbop.desktop")
        } else if let Ok(home) = env::var("HOME") {
            PathBuf::from(home).join(".config").join("com.phimbop.desktop")
        } else {
            PathBuf::from("./pb-desk-data")
        }
    })
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args: Vec<String> = env::args().collect();

    let data_dir = resolve_data_dir();
    fs::create_dir_all(&data_dir)
        .map_err(|e| anyhow::anyhow!("Failed to create data directory at {:?}: {}", data_dir, e))?;

    let db_path = data_dir.join("pb_desk.db");

    let storage = Arc::new(
        SqliteStorage::new(&db_path)
            .map_err(|e| anyhow::anyhow!("Failed to open persistent SQLite database at {:?}: {}", db_path, e))?,
    );

    if args.iter().any(|a| a == "--check") {
        println!("OK");
        return Ok(());
    }

    let api_client = MovieApiClient::new();
    let movie_service = MovieService::new(api_client.clone(), Arc::clone(&storage) as _);
    let history_service = HistoryService::new(Arc::clone(&storage) as _);
    let favorite_service = FavoriteService::new(Arc::clone(&storage) as _);
    let surreal_client = SurrealClient::new();
    let auth_service = AuthService::new(surreal_client.clone());
    let notification_worker = NotificationWorker::new(Arc::clone(&storage), api_client);

    let state = Arc::new(AppState {
        movie_service,
        history_service,
        favorite_service,
        auth_service,
        surreal_client,
        storage: Arc::clone(&storage),
        notification_worker,
    });

    let (event_tx, mut event_rx) = mpsc::unbounded_channel::<OutgoingEvent>();

    // Background notification polling loop
    let state_for_worker = Arc::clone(&state);
    let event_tx_clone = event_tx.clone();
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(15)).await;
        loop {
            let settings = state_for_worker.storage.get_settings().unwrap_or_default();
            if settings.notify_new_movies {
                if let Ok(updates) = state_for_worker.notification_worker.check_for_updates().await {
                    for ev in updates {
                        let ipc_ev: IpcMovieUpdateEvent = ev.into();
                        if let Ok(data) = serde_json::to_value(&ipc_ev) {
                            let _ = event_tx_clone.send(OutgoingEvent {
                                msg_type: "event",
                                event: "movie-update".to_string(),
                                data,
                            });
                        }
                    }
                }
            }

            let interval_mins = state_for_worker
                .storage
                .get_settings()
                .map(|s| s.check_interval_mins)
                .unwrap_or(15)
                .max(5);
            tokio::time::sleep(tokio::time::Duration::from_secs(interval_mins as u64 * 60)).await;
        }
    });

    // Event printer task
    tokio::spawn(async move {
        while let Some(ev) = event_rx.recv().await {
            if let Ok(line) = serde_json::to_string(&ev) {
                let stdout = io::stdout();
                let mut handle = stdout.lock();
                let _ = writeln!(handle, "{}", line);
                let _ = handle.flush();
            }
        }
    });

    // Stdin reading loop on dedicated thread
    let (req_tx, mut req_rx) = mpsc::unbounded_channel::<Request>();
    std::thread::spawn(move || {
        let stdin = io::stdin();
        for line_res in stdin.lock().lines() {
            match line_res {
                Ok(line) => {
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        continue;
                    }
                    if let Ok(req) = serde_json::from_str::<Request>(trimmed) {
                        if req_tx.send(req).is_err() {
                            break;
                        }
                    } else {
                        eprintln!("[pb-sidecar] Malformed JSON input: {}", trimmed);
                    }
                }
                Err(_) => break,
            }
        }
    });

    // Request processor with JoinSet to ensure in-flight requests finish before exit
    let mut join_set = tokio::task::JoinSet::new();

    while let Some(req) = req_rx.recv().await {
        let state_ref = Arc::clone(&state);
        join_set.spawn(async move {
            let response = handle_request(&state_ref, req).await;
            if let Ok(json_line) = serde_json::to_string(&response) {
                let stdout = io::stdout();
                let mut handle = stdout.lock();
                let _ = writeln!(handle, "{}", json_line);
                let _ = handle.flush();
            }
        });
    }

    // Drain remaining in-flight tasks before exiting
    while join_set.join_next().await.is_some() {}

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ping_and_unknown() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let storage = Arc::new(SqliteStorage::new(&db_path).unwrap());
        let api_client = MovieApiClient::new();
        let movie_service = MovieService::new(api_client.clone(), Arc::clone(&storage) as _);
        let history_service = HistoryService::new(Arc::clone(&storage) as _);
        let favorite_service = FavoriteService::new(Arc::clone(&storage) as _);
        let surreal_client = SurrealClient::new();
        let auth_service = AuthService::new(surreal_client.clone());
        let notification_worker = NotificationWorker::new(Arc::clone(&storage), api_client);

        let state = AppState {
            movie_service,
            history_service,
            favorite_service,
            auth_service,
            surreal_client,
            storage,
            notification_worker,
        };

        let req_ping = Request {
            id: serde_json::json!(1),
            method: "ping".to_string(),
            params: Value::Null,
        };
        let res_ping = handle_request(&state, req_ping).await;
        assert_eq!(res_ping.id, serde_json::json!(1));
        assert_eq!(res_ping.result, Some(Value::String("pong".to_string())));
        assert!(res_ping.error.is_none());

        let req_unknown = Request {
            id: serde_json::json!("test-str-id"),
            method: "non_existent_command".to_string(),
            params: Value::Null,
        };
        let res_unknown = handle_request(&state, req_unknown).await;
        assert_eq!(res_unknown.id, serde_json::json!("test-str-id"));
        assert!(res_unknown.result.is_none());
        assert!(res_unknown.error.is_some());
    }
}
