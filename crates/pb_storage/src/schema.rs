use rusqlite::Connection;

pub fn initialize_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS watch_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_slug TEXT NOT NULL UNIQUE,
            movie_name TEXT NOT NULL,
            poster_url TEXT NOT NULL,
            episode_name TEXT NOT NULL,
            episode_slug TEXT NOT NULL,
            link_m3u8 TEXT NOT NULL,
            duration REAL NOT NULL,
            current_time_sec REAL NOT NULL,
            progress_percent REAL NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_slug TEXT NOT NULL UNIQUE,
            movie_name TEXT NOT NULL,
            origin_name TEXT NOT NULL,
            poster_url TEXT NOT NULL,
            year INTEGER,
            quality TEXT,
            episode_current TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_watch_history_updated ON watch_history(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
        "
    )?;
    Ok(())
}
