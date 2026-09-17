pub mod schema;
pub mod sqlite;

pub use sqlite::SqliteStorage;

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use pb_core::models::{FavoriteMovieItem, WatchHistoryItem};
    use pb_core::traits::{FavoriteRepository, HistoryRepository, MovieCacheRepository};

    #[test]
    fn test_history_crud() {
        let storage = SqliteStorage::new_in_memory().unwrap();
        let item = WatchHistoryItem {
            id: None,
            movie_slug: "dau-la-dai-luc".to_string(),
            movie_name: "Đấu La Đại Lục".to_string(),
            poster_url: "poster.jpg".to_string(),
            episode_name: "Tập 1".to_string(),
            episode_slug: "tap-1".to_string(),
            link_m3u8: "https://example.com/stream.m3u8".to_string(),
            duration: 1200.0,
            current_time: 300.0,
            progress_percent: 25.0,
            updated_at: Utc::now(),
        };

        storage.save_history(item.clone()).unwrap();
        let list = storage.get_history(10).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].movie_slug, "dau-la-dai-luc");
        assert_eq!(list[0].current_time, 300.0);

        // Update with new progress
        let mut updated = item;
        updated.current_time = 600.0;
        updated.progress_percent = 50.0;
        storage.save_history(updated).unwrap();

        let list2 = storage.get_history(10).unwrap();
        assert_eq!(list2.len(), 1);
        assert_eq!(list2[0].current_time, 600.0);

        // Delete
        storage.delete_history("dau-la-dai-luc").unwrap();
        let list3 = storage.get_history(10).unwrap();
        assert_eq!(list3.len(), 0);
    }

    #[test]
    fn test_favorite_crud() {
        let storage = SqliteStorage::new_in_memory().unwrap();
        let item = FavoriteMovieItem {
            id: None,
            movie_slug: "one-piece".to_string(),
            movie_name: "One Piece".to_string(),
            origin_name: "One Piece".to_string(),
            poster_url: "onepiece.jpg".to_string(),
            year: Some(1999),
            quality: Some("FHD".to_string()),
            episode_current: Some("Tập 1100".to_string()),
            created_at: Utc::now(),
        };

        assert!(!storage.is_favorite("one-piece").unwrap());
        storage.add_favorite(item).unwrap();
        assert!(storage.is_favorite("one-piece").unwrap());

        let res = storage.get_favorites(1, 10).unwrap();
        assert_eq!(res.items.len(), 1);
        assert_eq!(res.total_items, 1);

        storage.remove_favorite("one-piece").unwrap();
        assert!(!storage.is_favorite("one-piece").unwrap());
    }

    #[test]
    fn test_cache() {
        let storage = SqliteStorage::new_in_memory().unwrap();
        storage.set_cached_json("test_key", "{\"hello\":\"world\"}", 100).unwrap();
        let cached = storage.get_cached_json("test_key").unwrap();
        assert_eq!(cached, Some("{\"hello\":\"world\"}".to_string()));
    }

    #[test]
    fn test_settings_and_notified_movies() {
        let storage = SqliteStorage::new_in_memory().unwrap();

        // 1. Settings default
        let default_settings = storage.get_settings().unwrap();
        assert!(default_settings.autostart);
        assert!(default_settings.minimize_to_tray);

        // 2. Save custom settings
        let mut custom = default_settings;
        custom.autostart = false;
        custom.check_interval_mins = 30;
        storage.save_settings(&custom).unwrap();

        let loaded = storage.get_settings().unwrap();
        assert!(!loaded.autostart);
        assert_eq!(loaded.check_interval_mins, 30);

        // 3. Notified movies
        assert!(!storage.is_movie_notified("attack-on-titan", Some("Tập 1")).unwrap());

        let notified_item = pb_core::models::NotifiedMovie {
            movie_slug: "attack-on-titan".to_string(),
            movie_name: "Attack on Titan".to_string(),
            last_episode: Some("Tập 1".to_string()),
            notified_at: Utc::now(),
        };
        storage.mark_movie_notified(notified_item).unwrap();

        // Same episode should return true (already notified)
        assert!(storage.is_movie_notified("attack-on-titan", Some("Tập 1")).unwrap());
        // New episode should return false (not notified yet!)
        assert!(!storage.is_movie_notified("attack-on-titan", Some("Tập 2")).unwrap());

        let list = storage.get_notified_movies(10).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].movie_slug, "attack-on-titan");
    }

    #[test]
    fn test_installation_id_persistence() {
        let storage = SqliteStorage::new_in_memory().unwrap();

        // 1. Initial generation
        let id1 = storage.get_or_create_installation_id().unwrap();
        assert!(!id1.is_empty());
        // Verify it is a valid UUIDv4
        let parsed = uuid::Uuid::parse_str(&id1);
        assert!(parsed.is_ok(), "installation_id must be a valid UUID");
        assert_eq!(parsed.unwrap().get_version_num(), 4);

        // 2. Subsequent call must return the exact same installation_id
        let id2 = storage.get_or_create_installation_id().unwrap();
        assert_eq!(id1, id2, "installation_id must be persistent across calls");
    }

    #[test]
    fn test_sqlite_file_persistence_across_restarts() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join(format!("pb_test_persistence_{}.db", uuid::Uuid::new_v4()));

        // Step 1: Initialize storage at file path, save settings, installation_id, and favorites
        {
            let storage = SqliteStorage::new(&db_path).expect("Failed to initialize storage at file path");
            let mut settings = storage.get_settings().expect("Failed to get default settings");
            settings.autostart = false;
            settings.check_interval_mins = 45;
            storage.save_settings(&settings).expect("Failed to save settings");

            let inst_id = storage.get_or_create_installation_id().expect("Failed to get installation id");
            assert!(!inst_id.is_empty());

            let fav = FavoriteMovieItem {
                id: None,
                movie_slug: "persistent-movie".into(),
                movie_name: "Persistent Movie".into(),
                origin_name: "Original Persistent".into(),
                poster_url: "https://example.com/poster.jpg".into(),
                year: Some(2026),
                quality: Some("FHD".into()),
                episode_current: Some("Tập 1".into()),
                created_at: Utc::now(),
            };
            storage.add_favorite(fav).expect("Failed to add favorite");
        } // storage instance dropped here, closing connection

        // Step 2: Reopen the SQLite file (simulating app restart) and verify data persistence
        {
            let storage_reopened = SqliteStorage::new(&db_path).expect("Failed to reopen storage from existing file");
            let loaded_settings = storage_reopened.get_settings().expect("Failed to get settings after reopen");
            assert_eq!(loaded_settings.autostart, false);
            assert_eq!(loaded_settings.check_interval_mins, 45);

            let loaded_inst_id = storage_reopened.get_or_create_installation_id().expect("Failed to get installation id after reopen");
            assert!(!loaded_inst_id.is_empty());

            let favs = storage_reopened.get_favorites(1, 10).expect("Failed to get favorites after reopen");
            assert_eq!(favs.items.len(), 1);
            assert_eq!(favs.items[0].movie_slug, "persistent-movie");
        }

        // Clean up temporary file
        let _ = std::fs::remove_file(&db_path);
    }

    #[test]
    fn test_sqlite_open_invalid_path_fails_explicitly() {
        let invalid_path = std::path::PathBuf::from("/proc/non_existent_dir_pb_desk/impossible.db");
        let result = SqliteStorage::new(&invalid_path);
        assert!(result.is_err(), "Opening an invalid path must return an error and not silently succeed");
    }
}
