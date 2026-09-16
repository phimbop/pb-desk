use std::path::Path;
use std::sync::Mutex;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use pb_core::error::{PbError, PbResult};
use pb_core::models::{
    AppSettings, FavoriteMovieItem, MovieDetail, NotifiedMovie, PaginatedResult, WatchHistoryItem,
};
use pb_core::traits::{FavoriteRepository, HistoryRepository, MovieCacheRepository};

pub struct SqliteStorage {
    conn: Mutex<Connection>,
}

impl SqliteStorage {
    pub fn new_in_memory() -> PbResult<Self> {
        let conn = Connection::open_in_memory()
            .map_err(|e| PbError::Database(e.to_string()))?;
        crate::schema::initialize_schema(&conn)
            .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn new<P: AsRef<Path>>(path: P) -> PbResult<Self> {
        let conn = Connection::open(path)
            .map_err(|e| PbError::Database(e.to_string()))?;
        crate::schema::initialize_schema(&conn)
            .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn get_settings(&self) -> PbResult<AppSettings> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let mut stmt = conn
            .prepare("SELECT value FROM app_settings WHERE key = 'config'")
            .map_err(|e| PbError::Database(e.to_string()))?;

        let mut rows = stmt
            .query(params![])
            .map_err(|e| PbError::Database(e.to_string()))?;

        if let Some(row) = rows.next().map_err(|e| PbError::Database(e.to_string()))? {
            let json_str: String = row.get(0).map_err(|e| PbError::Database(e.to_string()))?;
            let settings: AppSettings = serde_json::from_str(&json_str)
                .map_err(|e| PbError::Serialization(e.to_string()))?;
            Ok(settings)
        } else {
            Ok(AppSettings::default())
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let json_str = serde_json::to_string(settings)
            .map_err(|e| PbError::Serialization(e.to_string()))?;

        conn.execute(
            "INSERT INTO app_settings (key, value) VALUES ('config', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![json_str],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }

    pub fn is_movie_notified(&self, slug: &str, episode: Option<&str>) -> PbResult<bool> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let mut stmt = conn
            .prepare("SELECT last_episode FROM notified_movies WHERE movie_slug = ?1")
            .map_err(|e| PbError::Database(e.to_string()))?;

        let mut rows = stmt
            .query(params![slug])
            .map_err(|e| PbError::Database(e.to_string()))?;

        if let Some(row) = rows.next().map_err(|e| PbError::Database(e.to_string()))? {
            let last_ep: Option<String> = row.get(0).map_err(|e| PbError::Database(e.to_string()))?;
            match (episode, last_ep.as_deref()) {
                (Some(curr), Some(last)) => Ok(curr.trim() == last.trim()),
                (Some(_), None) => Ok(false), // has episode now, but previously didn't have episode recorded
                (None, _) => Ok(true), // already notified as a movie
            }
        } else {
            Ok(false) // not notified yet
        }
    }

    pub fn mark_movie_notified(&self, item: NotifiedMovie) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let notified_str = item.notified_at.to_rfc3339();
        conn.execute(
            "INSERT INTO notified_movies (movie_slug, movie_name, last_episode, notified_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(movie_slug) DO UPDATE SET
                 movie_name = excluded.movie_name,
                 last_episode = excluded.last_episode,
                 notified_at = excluded.notified_at",
            params![item.movie_slug, item.movie_name, item.last_episode, notified_str],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }

    pub fn get_notified_movies(&self, limit: u32) -> PbResult<Vec<NotifiedMovie>> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let mut stmt = conn
            .prepare(
                "SELECT movie_slug, movie_name, last_episode, notified_at
                 FROM notified_movies
                 ORDER BY notified_at DESC
                 LIMIT ?1",
            )
            .map_err(|e| PbError::Database(e.to_string()))?;

        let rows = stmt
            .query_map(params![limit], |row| {
                let time_str: String = row.get(3)?;
                let notified_at = DateTime::parse_from_rfc3339(&time_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                Ok(NotifiedMovie {
                    movie_slug: row.get(0)?,
                    movie_name: row.get(1)?,
                    last_episode: row.get(2)?,
                    notified_at,
                })
            })
            .map_err(|e| PbError::Database(e.to_string()))?;

        let mut items = Vec::new();
        for item in rows {
            items.push(item.map_err(|e| PbError::Database(e.to_string()))?);
        }
        Ok(items)
    }
}

impl HistoryRepository for SqliteStorage {
    fn get_history(&self, limit: u32) -> PbResult<Vec<WatchHistoryItem>> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let mut stmt = conn
            .prepare(
                "SELECT id, movie_slug, movie_name, poster_url, episode_name, episode_slug, link_m3u8,
                        duration, current_time_sec, progress_percent, updated_at
                 FROM watch_history
                 ORDER BY updated_at DESC
                 LIMIT ?1"
            )
            .map_err(|e| PbError::Database(e.to_string()))?;

        let rows = stmt
            .query_map(params![limit], |row| {
                let updated_str: String = row.get(10)?;
                let updated_at = DateTime::parse_from_rfc3339(&updated_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                Ok(WatchHistoryItem {
                    id: Some(row.get(0)?),
                    movie_slug: row.get(1)?,
                    movie_name: row.get(2)?,
                    poster_url: row.get(3)?,
                    episode_name: row.get(4)?,
                    episode_slug: row.get(5)?,
                    link_m3u8: row.get(6)?,
                    duration: row.get(7)?,
                    current_time: row.get(8)?,
                    progress_percent: row.get(9)?,
                    updated_at,
                })
            })
            .map_err(|e| PbError::Database(e.to_string()))?;

        let mut items = Vec::new();
        for item in rows {
            items.push(item.map_err(|e| PbError::Database(e.to_string()))?);
        }
        Ok(items)
    }

    fn save_history(&self, item: WatchHistoryItem) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        conn.execute(
            "INSERT INTO watch_history (
                movie_slug, movie_name, poster_url, episode_name, episode_slug,
                link_m3u8, duration, current_time_sec, progress_percent, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ON CONFLICT(movie_slug) DO UPDATE SET
                movie_name = excluded.movie_name,
                poster_url = excluded.poster_url,
                episode_name = excluded.episode_name,
                episode_slug = excluded.episode_slug,
                link_m3u8 = excluded.link_m3u8,
                duration = excluded.duration,
                current_time_sec = excluded.current_time_sec,
                progress_percent = excluded.progress_percent,
                updated_at = excluded.updated_at;",
            params![
                item.movie_slug,
                item.movie_name,
                item.poster_url,
                item.episode_name,
                item.episode_slug,
                item.link_m3u8,
                item.duration,
                item.current_time,
                item.progress_percent,
                item.updated_at.to_rfc3339()
            ],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }

    fn delete_history(&self, movie_slug: &str) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        conn.execute(
            "DELETE FROM watch_history WHERE movie_slug = ?1",
            params![movie_slug],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }

    fn clear_history(&self) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        conn.execute("DELETE FROM watch_history", [])
            .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }
}

impl FavoriteRepository for SqliteStorage {
    fn get_favorites(&self, page: u32, limit: u32) -> PbResult<PaginatedResult<FavoriteMovieItem>> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        
        let total_items: u32 = conn
            .query_row("SELECT COUNT(*) FROM favorites", [], |r| r.get(0))
            .map_err(|e| PbError::Database(e.to_string()))?;

        let offset = page.saturating_sub(1) * limit;
        let mut stmt = conn
            .prepare(
                "SELECT id, movie_slug, movie_name, origin_name, poster_url, year, quality, episode_current, created_at
                 FROM favorites
                 ORDER BY created_at DESC
                 LIMIT ?1 OFFSET ?2"
            )
            .map_err(|e| PbError::Database(e.to_string()))?;

        let rows = stmt
            .query_map(params![limit, offset], |row| {
                let created_str: String = row.get(8)?;
                let created_at = DateTime::parse_from_rfc3339(&created_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                Ok(FavoriteMovieItem {
                    id: Some(row.get(0)?),
                    movie_slug: row.get(1)?,
                    movie_name: row.get(2)?,
                    origin_name: row.get(3)?,
                    poster_url: row.get(4)?,
                    year: row.get(5)?,
                    quality: row.get(6)?,
                    episode_current: row.get(7)?,
                    created_at,
                })
            })
            .map_err(|e| PbError::Database(e.to_string()))?;

        let mut items = Vec::new();
        for item in rows {
            items.push(item.map_err(|e| PbError::Database(e.to_string()))?);
        }

        let total_pages = if total_items == 0 {
            1
        } else {
            total_items.div_ceil(limit)
        };

        Ok(PaginatedResult {
            items,
            current_page: page,
            total_pages,
            total_items,
            items_per_page: limit,
        })
    }

    fn add_favorite(&self, item: FavoriteMovieItem) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        conn.execute(
            "INSERT INTO favorites (
                movie_slug, movie_name, origin_name, poster_url, year, quality, episode_current, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            ON CONFLICT(movie_slug) DO UPDATE SET
                movie_name = excluded.movie_name,
                origin_name = excluded.origin_name,
                poster_url = excluded.poster_url,
                year = excluded.year,
                quality = excluded.quality,
                episode_current = excluded.episode_current;",
            params![
                item.movie_slug,
                item.movie_name,
                item.origin_name,
                item.poster_url,
                item.year,
                item.quality,
                item.episode_current,
                item.created_at.to_rfc3339()
            ],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }

    fn remove_favorite(&self, movie_slug: &str) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        conn.execute(
            "DELETE FROM favorites WHERE movie_slug = ?1",
            params![movie_slug],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }

    fn is_favorite(&self, movie_slug: &str) -> PbResult<bool> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let count: u32 = conn
            .query_row(
                "SELECT COUNT(*) FROM favorites WHERE movie_slug = ?1",
                params![movie_slug],
                |r| r.get(0),
            )
            .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(count > 0)
    }
}

impl MovieCacheRepository for SqliteStorage {
    fn get_cached_movie(&self, slug: &str) -> PbResult<Option<MovieDetail>> {
        let key = format!("movie:{}", slug);
        if let Some(json_str) = self.get_cached_json(&key)? {
            let detail: MovieDetail = serde_json::from_str(&json_str)
                .map_err(|e| PbError::Serialization(e.to_string()))?;
            Ok(Some(detail))
        } else {
            Ok(None)
        }
    }

    fn set_cached_movie(&self, movie: &MovieDetail, ttl_secs: u64) -> PbResult<()> {
        let key = format!("movie:{}", movie.slug);
        let json_str = serde_json::to_string(movie)
            .map_err(|e| PbError::Serialization(e.to_string()))?;
        self.set_cached_json(&key, &json_str, ttl_secs)
    }

    fn get_cached_json(&self, key: &str) -> PbResult<Option<String>> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let now = Utc::now().timestamp();
        let mut stmt = conn
            .prepare("SELECT data FROM cache WHERE key = ?1 AND expires_at > ?2")
            .map_err(|e| PbError::Database(e.to_string()))?;

        let mut rows = stmt
            .query(params![key, now])
            .map_err(|e| PbError::Database(e.to_string()))?;

        if let Some(row) = rows.next().map_err(|e| PbError::Database(e.to_string()))? {
            let data: String = row.get(0).map_err(|e| PbError::Database(e.to_string()))?;
            Ok(Some(data))
        } else {
            Ok(None)
        }
    }

    fn set_cached_json(&self, key: &str, data: &str, ttl_secs: u64) -> PbResult<()> {
        let conn = self.conn.lock().map_err(|_| PbError::Internal("Lock poisoned".into()))?;
        let expires_at = Utc::now().timestamp() + (ttl_secs as i64);
        conn.execute(
            "INSERT INTO cache (key, data, expires_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(key) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at",
            params![key, data, expires_at],
        )
        .map_err(|e| PbError::Database(e.to_string()))?;
        Ok(())
    }
}
