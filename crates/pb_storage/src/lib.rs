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
}
