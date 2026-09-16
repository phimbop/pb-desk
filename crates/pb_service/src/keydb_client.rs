use pb_core::error::{PbError, PbResult};
use pb_core::models::WatchingItem;
use crate::surreal_client::SurrealClient;
use redis::AsyncCommands;
use std::collections::HashMap;
use std::time::Duration;

const DEFAULT_KEYDB_HOST: &str = "keydb2.swinglust.top";
const DEFAULT_KEYDB_PORT: u16 = 6379;
const DEFAULT_KEYDB_PASS: &str = "Login@123";
const CACHE_KEY: &str = "cache:top_watching_list";
const CACHE_TTL_SECS: u64 = 10;
const FALLBACK_API_URL: &str = "https://v3.phimbop.cfd/api/watching/list";

#[derive(Clone)]
pub struct KeydbClient {
    client: redis::Client,
    http_client: reqwest::Client,
}

impl Default for KeydbClient {
    fn default() -> Self {
        Self::new()
    }
}

impl KeydbClient {
    pub fn new() -> Self {
        let host = std::env::var("KEYDB_URL")
            .unwrap_or_else(|_| DEFAULT_KEYDB_HOST.to_string());
        let port: u16 = std::env::var("KEYDB_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(DEFAULT_KEYDB_PORT);
        let pass = std::env::var("KEYDB_PASSWORD")
            .unwrap_or_else(|_| DEFAULT_KEYDB_PASS.to_string());

        let redis_url = if pass.is_empty() {
            format!("redis://{}:{}", host, port)
        } else {
            format!("redis://default:{}@{}:{}", pass, host, port)
        };

        let client = redis::Client::open(redis_url.as_str())
            .expect("Failed to create KeyDB/Redis client");

        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_default();

        Self {
            client,
            http_client,
        }
    }

    async fn get_conn(&self) -> PbResult<redis::aio::MultiplexedConnection> {
        self.client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| PbError::Network(format!("KeyDB connection error: {}", e)))
    }

    pub async fn ping(&self) -> PbResult<String> {
        let mut conn = self.get_conn().await?;
        redis::cmd("PING")
            .query_async(&mut conn)
            .await
            .map_err(|e| PbError::Network(format!("KeyDB PING error: {}", e)))
    }

    pub async fn record_heartbeat(&self, movie_id: &str, session_id: &str) -> PbResult<()> {
        let now = chrono::Utc::now().timestamp_millis();
        let session_key = format!("active_session:movie:{}:{}", movie_id, session_id);
        let movie_set_key = format!("movie:active:{}", movie_id);

        let mut conn = self.get_conn().await?;

        // 1. Mark session active with 30s TTL
        // 2. Add session to movie viewers with current timestamp
        // 3. Expire movie set after 120s
        // 4. Add movie to active_movies list with current timestamp
        // 5. Expire active_movies list after 1 day
        let mut pipe = redis::pipe();
        pipe.set_ex(&session_key, "1", 30)
            .zadd(&movie_set_key, session_id, now)
            .expire(&movie_set_key, 120)
            .zadd("active_movies", movie_id, now)
            .expire("active_movies", 86400);

        let () = pipe
            .query_async(&mut conn)
            .await
            .map_err(|e| PbError::Network(format!("KeyDB record_heartbeat error: {}", e)))?;

        // Also fire-and-forget sync to central API if desired
        let fallback_url = "https://v3.phimbop.cfd/api/watching/heartbeat";
        let req_body = serde_json::json!({
            "movieId": movie_id,
            "sessionId": session_id
        });
        let _ = self.http_client
            .post(fallback_url)
            .json(&req_body)
            .send()
            .await;

        Ok(())
    }

    pub async fn get_top_watching_movie_ids(&self, limit: usize) -> PbResult<Vec<(String, u64)>> {
        let now = chrono::Utc::now().timestamp_millis();
        let cutoff = now - 30_000; // 30 seconds cutoff

        let mut conn = self.get_conn().await?;

        // Clean up old entries from active_movies (> 1 day ago)
        let () = conn
            .zrembyscore("active_movies", 0, now - 86_400_000)
            .await
            .unwrap_or(());

        // Get all active movies in the last 30 seconds
        let active_movies: Vec<String> = conn
            .zrangebyscore("active_movies", cutoff, "+inf")
            .await
            .map_err(|e| PbError::Network(format!("KeyDB zrangebyscore error: {}", e)))?;

        if active_movies.is_empty() {
            return Ok(Vec::new());
        }

        let mut movie_counts = Vec::new();
        let mut dead_movies = Vec::new();

        for movie_id in &active_movies {
            let movie_key = format!("movie:active:{}", movie_id);
            // Remove expired sessions older than 30s
            let () = conn
                .zrembyscore(&movie_key, 0, cutoff)
                .await
                .unwrap_or(());

            // Count active sessions
            let count: u64 = conn
                .zcard(&movie_key)
                .await
                .unwrap_or(0);

            if count > 0 {
                movie_counts.push((movie_id.clone(), count));
            } else {
                dead_movies.push(movie_id.clone());
            }
        }

        // Cleanup dead movies from active_movies set
        if !dead_movies.is_empty() {
            for dead_id in dead_movies {
                let () = conn.zrem("active_movies", dead_id).await.unwrap_or(());
            }
        }

        // Sort descending by count
        movie_counts.sort_by(|a, b| b.1.cmp(&a.1));
        movie_counts.truncate(limit);

        Ok(movie_counts)
    }

    pub async fn get_watching_list(
        &self,
        surreal: &SurrealClient,
        limit: usize,
    ) -> PbResult<Vec<WatchingItem>> {
        // 1. Try KeyDB directly
        match self.fetch_watching_from_keydb_and_surreal(surreal, limit).await {
            Ok(list) => Ok(list),
            Err(err) => {
                eprintln!("[KeyDB] Error fetching watching list from KeyDB: {}. Falling back to remote API...", err);
                self.fallback_fetch_watching_list().await
            }
        }
    }

    async fn fetch_watching_from_keydb_and_surreal(
        &self,
        surreal: &SurrealClient,
        limit: usize,
    ) -> PbResult<Vec<WatchingItem>> {
        let mut conn = self.get_conn().await?;

        // 1. Check cache
        if let Ok(Some(cached_str)) = conn.get::<_, Option<String>>(CACHE_KEY).await {
            if let Ok(cached_list) = serde_json::from_str::<Vec<WatchingItem>>(&cached_str) {
                return Ok(cached_list);
            }
        }

        // 2. Get top watching movie ids and counts
        let movie_counts = self.get_top_watching_movie_ids(limit).await?;
        if movie_counts.is_empty() {
            let empty_json = serde_json::to_string(&Vec::<WatchingItem>::new()).unwrap_or_default();
            let () = conn.set_ex(CACHE_KEY, empty_json, CACHE_TTL_SECS).await.unwrap_or(());
            return Ok(Vec::new());
        }

        // 3. Fetch details from SurrealDB
        let ids: Vec<String> = movie_counts.iter().map(|(id, _)| id.clone()).collect();
        let db_movies = surreal.get_movies_by_ids(&ids).await?;

        let mut movie_map: HashMap<String, serde_json::Value> = HashMap::new();
        for db_movie in db_movies {
            let raw_id = if db_movie.id.starts_with("top_movie_list:") {
                db_movie.id.trim_start_matches("top_movie_list:").to_string()
            } else {
                db_movie.id
            };
            movie_map.insert(raw_id, db_movie.movie);
        }

        let mut result_list = Vec::new();
        for (movie_id, count) in movie_counts {
            if let Some(movie_val) = movie_map.get(&movie_id) {
                result_list.push(WatchingItem {
                    movie: movie_val.clone(),
                    watching: count,
                });
            }
        }

        // 4. Save to cache
        if let Ok(json_str) = serde_json::to_string(&result_list) {
            let () = conn.set_ex(CACHE_KEY, json_str, CACHE_TTL_SECS).await.unwrap_or(());
        }

        Ok(result_list)
    }

    async fn fallback_fetch_watching_list(&self) -> PbResult<Vec<WatchingItem>> {
        let resp = self
            .http_client
            .get(FALLBACK_API_URL)
            .send()
            .await
            .map_err(|e| PbError::Network(format!("Fallback watching API request failed: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "Fallback watching API status: {}",
                resp.status()
            )));
        }

        let items: Vec<WatchingItem> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("Fallback watching deserialization failed: {}", e)))?;

        Ok(items)
    }
}
