pub mod api_client;
pub mod auth_service;
pub mod favorite_service;
pub mod history_service;
pub mod keydb_client;
pub mod movie_service;
pub mod notification_worker;
pub mod surreal_client;

pub use api_client::MovieApiClient;
pub use auth_service::AuthService;
pub use favorite_service::FavoriteService;
pub use history_service::HistoryService;
pub use keydb_client::KeydbClient;
pub use movie_service::MovieService;
pub use notification_worker::{MovieCandidate, NotificationWorker};
pub use surreal_client::SurrealClient;

#[cfg(test)]
mod tests {
    use super::*;
    use pb_core::models::{AppSettings, FavoriteMovieItem};
    use pb_core::traits::FavoriteRepository;
    use pb_storage::SqliteStorage;
    use std::sync::Arc;

    #[tokio::test]
    async fn test_notification_worker_diff_and_deduplication() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let worker = NotificationWorker::new(storage.clone(), api_client);

        let settings = AppSettings::default();

        // 1. Process candidate: 1 series, 1 movie
        let candidates = vec![
            MovieCandidate {
                slug: "phim-hay-1".to_string(),
                name: "Phim Hay 1".to_string(),
                episode: Some("Tập 1".to_string()),
                poster_url: Some("https://example.com/p1.jpg".to_string()),
                source: "phim-bo".to_string(),
            },
            MovieCandidate {
                slug: "phim-le-1".to_string(),
                name: "Phim Lẻ 1".to_string(),
                episode: None,
                poster_url: Some("https://example.com/p2.jpg".to_string()),
                source: "phim-le".to_string(),
            },
        ];

        let events = worker.process_candidates(candidates.clone(), &settings).unwrap();
        assert_eq!(events.len(), 2);
        assert_eq!(events[0].movie_slug, "phim-hay-1");
        assert!(events[0].is_new_movie);
        assert_eq!(events[0].episode, Some("Tập 1".to_string()));

        // 2. Second pass with SAME candidates: should produce 0 events (no spam)
        let events2 = worker.process_candidates(candidates, &settings).unwrap();
        assert_eq!(events2.len(), 0);

        // 3. New episode for existing series: should produce 1 update event (not new movie)
        let candidates_new_ep = vec![MovieCandidate {
            slug: "phim-hay-1".to_string(),
            name: "Phim Hay 1".to_string(),
            episode: Some("Tập 2".to_string()),
            poster_url: Some("https://example.com/p1.jpg".to_string()),
            source: "phim-bo".to_string(),
        }];

        let events3 = worker.process_candidates(candidates_new_ep, &settings).unwrap();
        assert_eq!(events3.len(), 1);
        assert_eq!(events3[0].movie_slug, "phim-hay-1");
        assert_eq!(events3[0].episode, Some("Tập 2".to_string()));
        assert!(!events3[0].is_new_movie); // existing movie with new episode

        // 4. Test favorites_only mode
        let mut fav_settings = settings.clone();
        fav_settings.notify_mode = "favorites_only".to_string();

        let candidates_fav_test = vec![MovieCandidate {
            slug: "phim-la".to_string(),
            name: "Phim Lạ".to_string(),
            episode: Some("Tập 1".to_string()),
            poster_url: None,
            source: "phim-bo".to_string(),
        }];

        // Not in favorites: ignored
        let events4 = worker.process_candidates(candidates_fav_test.clone(), &fav_settings).unwrap();
        assert_eq!(events4.len(), 0);

        // Add to favorites
        storage.add_favorite(FavoriteMovieItem {
            id: None,
            movie_slug: "phim-la".to_string(),
            movie_name: "Phim Lạ".to_string(),
            origin_name: "Phim La".to_string(),
            poster_url: "".to_string(),
            year: None,
            quality: None,
            episode_current: None,
            created_at: chrono::Utc::now(),
        }).unwrap();

        // Now in favorites: detected!
        let events5 = worker.process_candidates(candidates_fav_test, &fav_settings).unwrap();
        assert_eq!(events5.len(), 1);
        assert_eq!(events5[0].movie_slug, "phim-la");
    }

    #[tokio::test]
    async fn test_movie_service_init() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let _service = MovieService::new(api_client, storage);
        let categories = movie_service::default_categories();
        assert!(!categories.is_empty());
    }

    #[tokio::test]
    async fn test_fetch_phim_18_and_hoat_hinh() {
        let client = MovieApiClient::new();
        let res_18 = client.get_movies_by_category("phim-18", 1, 24).await;
        match res_18 {
            Ok(data) => println!("res_18 items count: {}", data.items.len()),
            Err(e) => println!("Live API skip on network error: {:?}", e),
        }

        let res_bo = client.get_movies_by_list("phim-bo", 1, 1).await;
        match res_bo {
            Ok(data) => println!("res_bo items count: {}", data.items.len()),
            Err(e) => println!("Live API skip on network error: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_surreal_adult_movies() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let service = MovieService::new(api_client, storage);

        let adult_movies = service.get_adult_movies().await;
        match adult_movies {
            Ok(list) => println!("Loaded {} adult movies from SurrealDB!", list.len()),
            Err(e) => println!("Skipping live SurrealDB adult test on network error: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_keydb_and_watching() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let service = MovieService::new(api_client, storage);

        let ping_res = service.ping_keydb().await;
        println!("KeyDB ping result: {:?}", ping_res);

        let watching_res = service.get_watching_list(10).await;
        match watching_res {
            Ok(items) => println!("Watching list count: {}", items.len()),
            Err(e) => println!("Skipping live KeyDB test on network error: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_surreal_leaderboards() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let service = MovieService::new(api_client, storage);

        let res = service.get_leaderboards().await;
        match res {
            Ok(leaderboards) => println!("Leaderboards watchers: {}", leaderboards.top_watchers.len()),
            Err(e) => println!("Skipping live SurrealDB leaderboards on network error: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_auth_service_and_watch_stats() {
        let auth = AuthService::default();
        let res = auth.login("test_user_not_exist@phimbop.top", "invalid_password").await;
        match res {
            Ok(auth_res) => assert!(!auth_res.success),
            Err(e) => println!("Skipping live auth test on network error: {:?}", e),
        }

        let surreal = SurrealClient::new();
        let stats = surreal.get_user_watch_stats("user:non_existent_test_id").await;
        match stats {
            Ok(stats_val) => {
                assert_eq!(stats_val.total_movies, 0);
            }
            Err(e) => println!("Skipping live watch stats on network error: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_native_surreal_auth_and_favorites() {
        let surreal = SurrealClient::new();
        let auth = AuthService::new(surreal.clone());

        let res = auth.login("non_existent_user_for_test@domain.com", "wrong_password").await;
        match res {
            Ok(login_res) => assert!(!login_res.success),
            Err(e) => println!("Skipping live auth login test on network error: {:?}", e),
        }

        let favs = surreal.get_user_favorites("user:test_non_existent").await;
        match favs {
            Ok(f) => println!("Favorites: {}", f.len()),
            Err(e) => println!("Skipping live SurrealDB favorites on network error: {:?}", e),
        }

        // 4. Test forward_request intercepts /api/user/favorites without token => 401
        let req = pb_core::models::ForwardRequest {
            method: "GET".to_string(),
            path: "/api/user/favorites".to_string(),
            body: None,
            token: None,
        };
        let fwd_res = auth.forward_request(req).await;
        assert!(fwd_res.is_ok());
        let fwd_val = fwd_res.unwrap();
        assert_eq!(fwd_val.status, 401);
    }

    #[test]
    fn test_surreal_url_normalization() {
        use crate::surreal_client::normalize_surreal_url;
        assert_eq!(
            normalize_surreal_url("wss://srv2.phimbop.cfd/rpc"),
            "https://srv2.phimbop.cfd/sql"
        );
        assert_eq!(
            normalize_surreal_url("ws://localhost:8000/rpc"),
            "http://localhost:8000/sql"
        );
        assert_eq!(
            normalize_surreal_url("https://new-domain.com/sql"),
            "https://new-domain.com/sql"
        );
        assert_eq!(
            normalize_surreal_url("https://new-domain.com/"),
            "https://new-domain.com/sql"
        );
        assert_eq!(
            normalize_surreal_url("https://new-domain.com"),
            "https://new-domain.com/sql"
        );
    }
}

