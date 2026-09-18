use chrono::{Datelike, TimeZone, Utc};
use pb_core::error::{PbError, PbResult};
use pb_core::models::{
    AdultMovieRecord, AuthResponse, AuthUser, LeaderboardUser, Leaderboards, WatchGenre, WatchStats,
};
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;

const DEFAULT_SURREAL_URL: &str = "https://srv2.phimbop.cfd/sql";
const DEFAULT_SURREAL_NS: &str = "pb";
const DEFAULT_SURREAL_DB: &str = "pbdb";

#[derive(Clone)]
pub struct SurrealClient {
    client: Client,
    url: String,
    ns: String,
    db: String,
    auth: String,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct SurrealSqlResponse<T> {
    #[serde(default)]
    result: Option<T>,
    #[serde(default)]
    status: Option<String>,
}

#[derive(Deserialize, Debug, Default)]
struct RawLeaderboardRow {
    #[serde(default)]
    user: Option<serde_json::Value>,
    #[serde(default)]
    username: Option<String>,
    #[serde(default)]
    avatar_url: Option<String>,
    #[serde(default)]
    watch_count: Option<u64>,
    #[serde(default)]
    rating_count: Option<u64>,
    #[serde(default)]
    comment_count: Option<u64>,
    #[serde(default)]
    count: Option<u64>,
}

fn extract_user_id(v: &Option<serde_json::Value>) -> String {
    match v {
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Object(map)) => {
            if let Some(serde_json::Value::String(id)) = map.get("id") {
                id.clone()
            } else {
                format!("{:?}", map)
            }
        }
        Some(other) => other.to_string(),
        None => String::new(),
    }
}

pub fn sanitize_id(id: &str) -> String {
    id.trim().chars().filter(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-' || *c == ':').collect()
}

pub fn normalize_user_id(id: &str) -> String {
    let clean = sanitize_id(id);
    if clean.starts_with("user:") {
        clean
    } else {
        format!("user:{}", clean)
    }
}


fn base64_encode(input: &str) -> String {
    const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bytes = input.as_bytes();
    let mut out = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        out.push(CHARSET[(b0 >> 2) as usize] as char);
        out.push(CHARSET[(((b0 & 3) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            out.push(CHARSET[(((b1 & 0x0f) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(CHARSET[(b2 & 0x3f) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

pub fn load_env_var_or_file(key: &str) -> Option<String> {
    if let Ok(val) = std::env::var(key) {
        let trimmed = val.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    for path in &[".env", "../.env", "../../.env"] {
        if let Ok(content) = std::fs::read_to_string(path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with('#') || !trimmed.contains('=') {
                    continue;
                }
                let mut parts = trimmed.splitn(2, '=');
                let k = parts.next().unwrap_or("").trim();
                let v = parts
                    .next()
                    .unwrap_or("")
                    .trim()
                    .trim_matches('"')
                    .trim_matches('\'');
                if k == key && !v.is_empty() {
                    return Some(v.to_string());
                }
            }
        }
    }
    None
}

pub fn normalize_surreal_url(raw: &str) -> String {
    let mut s = raw.trim().to_string();
    if s.starts_with("wss://") {
        s = format!("https://{}", &s[6..]);
    } else if s.starts_with("ws://") {
        s = format!("http://{}", &s[5..]);
    }
    let mut trimmed = s.as_str();
    loop {
        if let Some(rest) = trimmed.strip_suffix('/') {
            trimmed = rest;
        } else if let Some(rest) = trimmed.strip_suffix("/rpc") {
            trimmed = rest;
        } else if let Some(rest) = trimmed.strip_suffix("/sql") {
            trimmed = rest;
        } else {
            break;
        }
    }
    format!("{}/sql", trimmed)
}

impl Default for SurrealClient {
    fn default() -> Self {
        Self::new()
    }
}

impl SurrealClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_default();

        let raw_url = load_env_var_or_file("SURREAL_URL")
            .or_else(|| load_env_var_or_file("DB_ENDPOINT"))
            .unwrap_or_else(|| DEFAULT_SURREAL_URL.to_string());
        let url = normalize_surreal_url(&raw_url);

        let ns = load_env_var_or_file("SURREAL_NS")
            .or_else(|| load_env_var_or_file("DB_NS"))
            .unwrap_or_else(|| DEFAULT_SURREAL_NS.to_string());

        let db = load_env_var_or_file("SURREAL_DB")
            .or_else(|| load_env_var_or_file("DB_DB"))
            .unwrap_or_else(|| DEFAULT_SURREAL_DB.to_string());

        let user = load_env_var_or_file("SURREAL_USER")
            .or_else(|| load_env_var_or_file("DB_USER"))
            .unwrap_or_default();

        let pass = load_env_var_or_file("SURREAL_PASS")
            .or_else(|| load_env_var_or_file("DB_PASS"))
            .unwrap_or_default();

        let auth = if !user.is_empty() && !pass.is_empty() {
            format!("Basic {}", base64_encode(&format!("{}:{}", user, pass)))
        } else {
            String::new()
        };

        Self {
            client,
            url,
            ns,
            db,
            auth,
        }
    }

    pub fn apply_auth(&self, req: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        if !self.auth.is_empty() {
            req.header("Authorization", &self.auth)
        } else {
            req
        }
    }

    pub async fn get_adult_movies(&self) -> PbResult<Vec<AdultMovieRecord>> {
        let query = "SELECT * FROM top_movie_list WHERE is_18 = true;";
        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "SurrealDB HTTP status: {}",
                resp.status()
            )));
        }

        let body: Vec<SurrealSqlResponse<Vec<AdultMovieRecord>>> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB deserialization error: {}", e)))?;

        let movies = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        Ok(movies)
    }

    pub async fn get_movies_by_ids(&self, ids: &[String]) -> PbResult<Vec<AdultMovieRecord>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }

        let record_ids: Vec<String> = ids
            .iter()
            .map(|id| {
                let clean = sanitize_id(id);
                if clean.starts_with("top_movie_list:") {
                    clean
                } else if clean.chars().all(|c| c.is_ascii_digit()) {
                    format!("top_movie_list:{}", clean)
                } else {
                    format!("top_movie_list:⟨{}⟩", clean)
                }
            })
            .collect();

        let query = format!(
            "SELECT * FROM top_movie_list WHERE id IN [{}];",
            record_ids.join(", ")
        );

        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "SurrealDB HTTP status: {}",
                resp.status()
            )));
        }

        let body: Vec<SurrealSqlResponse<Vec<AdultMovieRecord>>> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB deserialization error: {}", e)))?;

        let movies = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        Ok(movies)
    }

    pub async fn get_leaderboards(&self) -> PbResult<Leaderboards> {
        let now = Utc::now();
        let start_of_month = Utc
            .with_ymd_and_hms(now.year(), now.month(), 1, 0, 0, 0)
            .single()
            .unwrap_or(now);
        let start_of_month_str = start_of_month.to_rfc3339();

        let query = format!(
            "SELECT user, user.username AS username, user.avatar_url AS avatar_url, count() AS watch_count FROM user_played_list WHERE updated_at >= type::datetime('{}') GROUP BY user, username, avatar_url;\n\
             SELECT user, user.username AS username, user.avatar_url AS avatar_url, count() AS rating_count FROM rating GROUP BY user, username, avatar_url;\n\
             SELECT user, user.username AS username, user.avatar_url AS avatar_url, count() AS comment_count FROM comment GROUP BY user, username, avatar_url;\n\
             SELECT user, count() AS count FROM user_played_list GROUP BY user;",
            start_of_month_str
        );

        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "SurrealDB HTTP status: {}",
                resp.status()
            )));
        }

        let body: Vec<SurrealSqlResponse<Vec<RawLeaderboardRow>>> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB deserialization error: {}", e)))?;

        let mut stmts = body.into_iter();
        let watchers_raw = stmts.next().and_then(|r| r.result).unwrap_or_default();
        let reviewers_raw = stmts.next().and_then(|r| r.result).unwrap_or_default();
        let commenters_raw = stmts.next().and_then(|r| r.result).unwrap_or_default();
        let total_counts_raw = stmts.next().and_then(|r| r.result).unwrap_or_default();

        let mut watch_hours_map = std::collections::HashMap::new();
        for row in total_counts_raw {
            let uid = extract_user_id(&row.user);
            if !uid.is_empty() {
                let count = row.count.unwrap_or(0);
                watch_hours_map.insert(normalize_user_id(&uid), count * 2);
            }
        }

        let mut top_watchers = Vec::new();
        for row in watchers_raw {
            let uid = extract_user_id(&row.user);
            if uid.is_empty() {
                continue;
            }
            let normalized = normalize_user_id(&uid);
            let total_watch_hours = watch_hours_map.get(&normalized).copied().unwrap_or(0);
            let count = row.watch_count.unwrap_or(0);
            top_watchers.push(LeaderboardUser {
                user_id: uid,
                username: row.username.unwrap_or_else(|| "Unknown".to_string()),
                avatar_url: row.avatar_url,
                count,
                hours: count * 2,
                total_watch_hours,
            });
        }
        top_watchers.sort_by(|a, b| b.count.cmp(&a.count));
        top_watchers.truncate(50);

        let mut top_reviewers = Vec::new();
        for row in reviewers_raw {
            let uid = extract_user_id(&row.user);
            if uid.is_empty() {
                continue;
            }
            let normalized = normalize_user_id(&uid);
            let total_watch_hours = watch_hours_map.get(&normalized).copied().unwrap_or(0);
            let count = row.rating_count.unwrap_or(0);
            top_reviewers.push(LeaderboardUser {
                user_id: uid,
                username: row.username.unwrap_or_else(|| "Unknown".to_string()),
                avatar_url: row.avatar_url,
                count,
                hours: 0,
                total_watch_hours,
            });
        }
        top_reviewers.sort_by(|a, b| b.count.cmp(&a.count));
        top_reviewers.truncate(50);

        let mut top_commenters = Vec::new();
        for row in commenters_raw {
            let uid = extract_user_id(&row.user);
            if uid.is_empty() {
                continue;
            }
            let normalized = normalize_user_id(&uid);
            let total_watch_hours = watch_hours_map.get(&normalized).copied().unwrap_or(0);
            let count = row.comment_count.unwrap_or(0);
            top_commenters.push(LeaderboardUser {
                user_id: uid,
                username: row.username.unwrap_or_else(|| "Unknown".to_string()),
                avatar_url: row.avatar_url,
                count,
                hours: 0,
                total_watch_hours,
            });
        }
        top_commenters.sort_by(|a, b| b.count.cmp(&a.count));
        top_commenters.truncate(50);

        Ok(Leaderboards {
            top_watchers,
            top_reviewers,
            top_commenters,
        })
    }

    pub async fn get_user_watch_stats(&self, user_id: &str) -> PbResult<WatchStats> {
        let normalized = normalize_user_id(user_id);

        // 1. Total movies watched
        let query_movies = format!(
            "SELECT count() AS count FROM user_played_list WHERE user = type::record('{}') OR user = '{}' GROUP ALL;",
            normalized, normalized
        );
        let mut req_movies = self.client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query_movies);
        req_movies = self.apply_auth(req_movies);
        let resp_movies = req_movies
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        let movies_res: Vec<SurrealSqlResponse<Vec<serde_json::Value>>> = resp_movies
            .json()
            .await
            .unwrap_or_default();

        let total_movies: u32 = movies_res
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .and_then(|rows| rows.into_iter().next())
            .and_then(|v| v.get("count").and_then(|c| c.as_u64()))
            .unwrap_or(0) as u32;

        let total_hours = total_movies * 2;

        // 2. Movie genres
        let query_data = format!(
            "SELECT movie_data FROM user_played_list WHERE user = type::record('{}') OR user = '{}';",
            normalized, normalized
        );
        let mut req_data = self.client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query_data);
        req_data = self.apply_auth(req_data);
        let resp_data = req_data
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        let data_res: Vec<SurrealSqlResponse<Vec<serde_json::Value>>> = resp_data
            .json()
            .await
            .unwrap_or_default();

        let movie_rows = data_res
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        let mut genre_counts = std::collections::HashMap::<String, u32>::new();
        for row in movie_rows {
            if let Some(movie_data) = row.get("movie_data") {
                if let Some(category) = movie_data.get("category").and_then(|c| c.as_array()) {
                    for cat in category {
                        if let Some(name) = cat.get("name").and_then(|n| n.as_str()) {
                            *genre_counts.entry(name.to_string()).or_insert(0) += 1;
                        }
                    }
                } else if let Some(genres) = movie_data.get("genres").and_then(|g| g.as_array()) {
                    for g in genres {
                        if let Some(name) = g.get("name").and_then(|n| n.as_str()) {
                            *genre_counts.entry(name.to_string()).or_insert(0) += 1;
                        }
                    }
                } else if let Some(movie_type) = movie_data.get("type").and_then(|t| t.as_str()) {
                    *genre_counts.entry(movie_type.to_string()).or_insert(0) += 1;
                }
            }
        }

        let mut top_genres_vec: Vec<WatchGenre> = genre_counts
            .into_iter()
            .map(|(name, count)| WatchGenre { name, count })
            .collect();
        top_genres_vec.sort_by(|a, b| b.count.cmp(&a.count));
        top_genres_vec.truncate(3);

        // 3. Ratings count
        let query_ratings = format!(
            "SELECT count() AS count FROM rating WHERE user = type::record('{}') OR user = '{}' GROUP ALL;",
            normalized, normalized
        );
        let mut req_ratings = self.client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query_ratings);
        req_ratings = self.apply_auth(req_ratings);
        let resp_ratings = req_ratings
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        let ratings_res: Vec<SurrealSqlResponse<Vec<serde_json::Value>>> = resp_ratings
            .json()
            .await
            .unwrap_or_default();

        let ratings_count: u32 = ratings_res
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .and_then(|rows| rows.into_iter().next())
            .and_then(|v| v.get("count").and_then(|c| c.as_u64()))
            .unwrap_or(0) as u32;

        Ok(WatchStats {
            total_movies,
            total_hours,
            top_genres: top_genres_vec,
            ratings_count,
        })
    }

    pub async fn auth_signin(&self, email: &str, password: &str) -> PbResult<AuthResponse> {
        let base = self.url.trim_end_matches("/sql").trim_end_matches('/');
        let signin_url = format!("{}/signin", base);
        let payload = serde_json::json!({
            "NS": self.ns,
            "DB": self.db,
            "AC": "user",
            "email": email,
            "password": password
        });

        let resp = self
            .client
            .post(&signin_url)
            .header("Accept", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB signin network error: {}", e)))?;

        let status = resp.status();
        let body: serde_json::Value = resp.json().await.map_err(|e| {
            PbError::Serialization(format!("SurrealDB signin response deserialization error: {}", e))
        })?;

        if status.is_success() {
            if let Some(token) = body.get("token").and_then(|v| v.as_str()) {
                let user = self.auth_get_me(token).await.ok();
                return Ok(AuthResponse {
                    success: true,
                    token: Some(token.to_string()),
                    user,
                    error: None,
                });
            }
        }

        let err_msg = body
            .get("information")
            .or_else(|| body.get("details"))
            .or_else(|| body.get("description"))
            .and_then(|v| v.as_str())
            .unwrap_or("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.");

        Ok(AuthResponse {
            success: false,
            token: None,
            user: None,
            error: Some(err_msg.to_string()),
        })
    }

    pub async fn auth_signup(&self, email: &str, username: &str, password: &str) -> PbResult<AuthResponse> {
        let base = self.url.trim_end_matches("/sql").trim_end_matches('/');
        let signup_url = format!("{}/signup", base);
        let payload = serde_json::json!({
            "NS": self.ns,
            "DB": self.db,
            "AC": "user",
            "email": email,
            "username": username,
            "password": password
        });

        let resp = self
            .client
            .post(&signup_url)
            .header("Accept", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB signup network error: {}", e)))?;

        let status = resp.status();
        let body: serde_json::Value = resp.json().await.map_err(|e| {
            PbError::Serialization(format!("SurrealDB signup response deserialization error: {}", e))
        })?;

        if status.is_success() {
            if let Some(token) = body.get("token").and_then(|v| v.as_str()) {
                let user = self.auth_get_me(token).await.ok();
                return Ok(AuthResponse {
                    success: true,
                    token: Some(token.to_string()),
                    user,
                    error: None,
                });
            }
        }

        let err_msg = body
            .get("information")
            .or_else(|| body.get("details"))
            .or_else(|| body.get("description"))
            .and_then(|v| v.as_str())
            .unwrap_or("Đăng ký thất bại. Email hoặc username có thể đã được sử dụng.");

        Ok(AuthResponse {
            success: false,
            token: None,
            user: None,
            error: Some(err_msg.to_string()),
        })
    }

    pub async fn auth_get_me(&self, token: &str) -> PbResult<AuthUser> {
        let resp = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/json")
            .body("SELECT id, email, username, avatar_url, created_at FROM $auth;")
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB get_me network error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Unauthorized);
        }

        let body: Vec<SurrealSqlResponse<Vec<AuthUser>>> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB get_me deserialization error: {}", e)))?;

        let user = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .and_then(|list| list.into_iter().next())
            .ok_or(PbError::Unauthorized)?;

        Ok(user)
    }

    pub async fn get_user_favorites(&self, user_id: &str) -> PbResult<Vec<serde_json::Value>> {
        let norm_id = normalize_user_id(user_id);
        let query = format!(
            "SELECT movie_data, added_at FROM user_favorites WHERE user = type::record('{}') OR user = '{}' ORDER BY added_at DESC;",
            norm_id, norm_id
        );

        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB get_favorites network error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("SurrealDB HTTP error: {}", resp.status())));
        }

        let body: Vec<SurrealSqlResponse<Vec<serde_json::Value>>> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB get_favorites deserialization error: {}", e)))?;

        let rows = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        let movies = rows
            .into_iter()
            .filter_map(|row| row.get("movie_data").cloned())
            .collect();

        Ok(movies)
    }

    pub async fn add_user_favorite(&self, user_id: &str, movie: &serde_json::Value) -> PbResult<()> {
        let norm_id = normalize_user_id(user_id);
        let movie_id_str = if let Some(id) = movie.get("_id").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            id.to_string()
        } else if let Some(id_str) = movie.get("id").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            id_str.to_string()
        } else if let Some(id_num) = movie.get("id").and_then(|v| v.as_i64()) {
            id_num.to_string()
        } else if let Some(slug) = movie.get("slug").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            slug.to_string()
        } else {
            return Err(PbError::InvalidArgument("Movie ID or slug missing".into()));
        };
        let clean_movie_id = sanitize_id(&movie_id_str);

        let movie_json = serde_json::to_string(movie).unwrap_or_else(|_| "{}".to_string());
        let query = format!(
            "INSERT INTO user_favorites (user, movie_id, movie_data, added_at) VALUES (type::record('{}'), '{}', {}, time::now()) ON DUPLICATE KEY UPDATE movie_data = {}, added_at = time::now();",
            norm_id, clean_movie_id, movie_json, movie_json
        );

        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB add_favorite network error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("SurrealDB HTTP error: {}", resp.status())));
        }

        Ok(())
    }

    pub async fn remove_user_favorite(&self, user_id: &str, movie_id: &str) -> PbResult<()> {
        let norm_id = normalize_user_id(user_id);
        let clean_movie_id = sanitize_id(movie_id);
        let query = format!(
            "DELETE FROM user_favorites WHERE (user = type::record('{}') OR user = '{}') AND movie_id = '{}';",
            norm_id, norm_id, clean_movie_id
        );

        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB remove_favorite network error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("SurrealDB HTTP error: {}", resp.status())));
        }

        Ok(())
    }

    pub async fn get_user_played_list(&self, user_id: &str) -> PbResult<Vec<serde_json::Value>> {
        let norm_id = normalize_user_id(user_id);
        let query = format!(
            "SELECT movie_data, updated_at FROM user_played_list WHERE user = type::record('{}') OR user = '{}' ORDER BY updated_at DESC LIMIT 50;",
            norm_id, norm_id
        );

        let mut req = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Accept", "application/json")
            .body(query);
        req = self.apply_auth(req);
        let resp = req
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB get_played_list network error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("SurrealDB HTTP error: {}", resp.status())));
        }

        let body: Vec<SurrealSqlResponse<Vec<serde_json::Value>>> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB get_played_list deserialization error: {}", e)))?;

        let rows = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        let movies = rows
            .into_iter()
            .filter_map(|row| row.get("movie_data").cloned())
            .collect();

        Ok(movies)
    }

    pub async fn migrate_user_data(
        &self,
        user_id: &str,
        played_list: &[serde_json::Value],
        favorites: &[serde_json::Value],
    ) -> PbResult<(usize, usize)> {
        let norm_id = normalize_user_id(user_id);
        let mut migrated_played = 0;
        let mut migrated_favorites = 0;

        for item in played_list {
            let movie_id = item
                .get("movie_id")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .or_else(|| item.get("id").and_then(|v| v.as_str()))
                .or_else(|| item.get("slug").and_then(|v| v.as_str()));

            if let Some(m_id) = movie_id {
                let clean_m_id = sanitize_id(m_id);
                let movie_data = item.get("movie_data").unwrap_or(item);
                let played_at = item
                    .get("played_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let updated_at = item
                    .get("updated_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                let p_at_str = if played_at.is_empty() {
                    "time::now()".to_string()
                } else {
                    format!("<datetime>'{}'", played_at)
                };
                let u_at_str = if updated_at.is_empty() {
                    "time::now()".to_string()
                } else {
                    format!("<datetime>'{}'", updated_at)
                };

                let movie_json = serde_json::to_string(movie_data).unwrap_or_else(|_| "{}".to_string());
                let query = format!(
                    "LET $existing = (SELECT * FROM user_played_list WHERE (user = type::record('{0}') OR user = '{0}') AND movie_id = '{1}' LIMIT 1);\
                     IF array::len($existing) = 0 THEN \
                         CREATE user_played_list SET user = type::record('{0}'), movie_id = '{1}', movie_data = {2}, played_at = {3}, updated_at = {4};\
                     ELSE IF {4} > $existing[0].updated_at THEN \
                         UPDATE user_played_list SET movie_data = {2}, played_at = {3}, updated_at = {4} WHERE (user = type::record('{0}') OR user = '{0}') AND movie_id = '{1}';\
                     END;",
                    norm_id, clean_m_id, movie_json, p_at_str, u_at_str
                );
                let mut req = self.client.post(&self.url)
                    .header("surreal-ns", &self.ns)
                    .header("surreal-db", &self.db)
                    .header("Accept", "application/json")
                    .body(query);
                req = self.apply_auth(req);
                let _ = req.send().await;
                migrated_played += 1;
            }
        }

        for item in favorites {
            let movie_id = item
                .get("movie_id")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .or_else(|| item.get("id").and_then(|v| v.as_str()))
                .or_else(|| item.get("slug").and_then(|v| v.as_str()));

            if let Some(m_id) = movie_id {
                let clean_m_id = sanitize_id(m_id);
                let movie_data = item.get("movie_data").unwrap_or(item);
                let added_at = item
                    .get("added_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                let a_at_str = if added_at.is_empty() {
                    "time::now()".to_string()
                } else {
                    format!("<datetime>'{}'", added_at)
                };

                let movie_json = serde_json::to_string(movie_data).unwrap_or_else(|_| "{}".to_string());
                let query = format!(
                    "LET $existing = (SELECT * FROM user_favorites WHERE (user = type::record('{0}') OR user = '{0}') AND movie_id = '{1}' LIMIT 1);\
                     IF array::len($existing) = 0 THEN \
                         CREATE user_favorites SET user = type::record('{0}'), movie_id = '{1}', movie_data = {2}, added_at = {3};\
                     END;",
                    norm_id, clean_m_id, movie_json, a_at_str
                );
                let mut req = self.client.post(&self.url)
                    .header("surreal-ns", &self.ns)
                    .header("surreal-db", &self.db)
                    .header("Accept", "application/json")
                    .body(query);
                req = self.apply_auth(req);
                let _ = req.send().await;
                migrated_favorites += 1;
            }
        }

        Ok((migrated_played, migrated_favorites))
    }
}

