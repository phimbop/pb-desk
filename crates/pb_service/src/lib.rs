pub mod api_client;
pub mod auth_service;
pub mod favorite_service;
pub mod history_service;
pub mod keydb_client;
pub mod movie_service;
pub mod surreal_client;

pub use api_client::MovieApiClient;
pub use auth_service::AuthService;
pub use favorite_service::FavoriteService;
pub use history_service::HistoryService;
pub use keydb_client::KeydbClient;
pub use movie_service::MovieService;
pub use surreal_client::SurrealClient;

#[cfg(test)]
mod tests {
    use super::*;
    use pb_storage::SqliteStorage;
    use std::sync::Arc;

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
        println!("res_18 item 0: {:?}", res_18.as_ref().map(|r| &r.items[0]));
        if let Err(ref e) = res_18 {
            println!("res_18 err: {:?}", e);
        }
        assert!(res_18.is_ok());

        let res_bo = client.get_movies_by_list("phim-bo", 1, 1).await;
        println!("res_bo item 0: {:?}", res_bo.as_ref().map(|r| &r.items[0]));
        if let Err(ref e) = res_bo {
            println!("res_bo err: {:?}", e);
        }
        assert!(res_bo.is_ok());

        let res_detail = client.get_movie_detail("giao-vien-piano").await;
        println!("res_detail: {:?}", res_detail.as_ref().map(|r| &r.name));
        if let Err(ref e) = res_detail {
            println!("res_detail err: {:?}", e);
        }
        assert!(res_detail.is_ok());
    }

    #[tokio::test]
    async fn test_surreal_adult_movies() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let service = MovieService::new(api_client, storage);

        let adult_movies = service.get_adult_movies().await;
        assert!(adult_movies.is_ok());
        let list = adult_movies.unwrap();
        assert!(!list.is_empty());
        println!("Loaded {} adult movies from SurrealDB!", list.len());
    }

    #[tokio::test]
    async fn test_keydb_and_watching() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let service = MovieService::new(api_client, storage);

        let ping_res = service.ping_keydb().await;
        println!("KeyDB ping result: {:?}", ping_res);
        if let Ok(pong) = ping_res {
            assert_eq!(pong, "PONG");
        }

        let watching_res = service.get_watching_list(10).await;
        println!("Watching list result count: {:?}", watching_res.as_ref().map(|v| v.len()));
        if let Ok(ref items) = watching_res {
            for (i, it) in items.iter().enumerate() {
                println!("  [{}] watching={} movie.name={:?}", i, it.watching, it.movie.get("name"));
            }
        }
        assert!(watching_res.is_ok());
    }

    #[tokio::test]
    async fn test_surreal_leaderboards() {
        let storage = Arc::new(SqliteStorage::new_in_memory().unwrap());
        let api_client = MovieApiClient::new();
        let service = MovieService::new(api_client, storage);

        let res = service.get_leaderboards().await;
        assert!(res.is_ok(), "get_leaderboards failed: {:?}", res.err());
        let leaderboards = res.unwrap();
        println!(
            "Leaderboards loaded: watchers={}, reviewers={}, commenters={}",
            leaderboards.top_watchers.len(),
            leaderboards.top_reviewers.len(),
            leaderboards.top_commenters.len()
        );
        for (i, u) in leaderboards.top_watchers.iter().take(5).enumerate() {
            println!(
                "  Watcher [#{}] user={} count={} hours={} total_watch_hours={}",
                i + 1,
                u.username,
                u.count,
                u.hours,
                u.total_watch_hours
            );
        }
        assert!(!leaderboards.top_reviewers.is_empty());
        assert!(!leaderboards.top_commenters.is_empty());
    }

    #[tokio::test]
    async fn test_auth_service_and_watch_stats() {
        let auth = AuthService::default();
        // Test invalid login returns success: false gracefully
        let res = auth.login("test_user_not_exist@phimbop.top", "invalid_password").await;
        assert!(res.is_ok());
        let auth_res = res.unwrap();
        assert!(!auth_res.success);
        assert!(auth_res.error.is_some());

        // Test surreal watch stats for user
        let surreal = SurrealClient::new();
        let stats = surreal.get_user_watch_stats("user:non_existent_test_id").await;
        assert!(stats.is_ok());
        let stats_val = stats.unwrap();
        assert_eq!(stats_val.total_movies, 0);
        assert_eq!(stats_val.total_hours, 0);
    }

    #[tokio::test]
    async fn test_native_surreal_auth_and_favorites() {
        let surreal = SurrealClient::new();
        let auth = AuthService::new(surreal.clone());

        // 1. Test native signin fails gracefully on bad credentials
        let res = auth.login("non_existent_user_for_test@domain.com", "wrong_password").await;
        assert!(res.is_ok());
        let login_res = res.unwrap();
        assert!(!login_res.success);
        assert!(login_res.token.is_none());

        // 2. Test get_user_favorites returns Ok vec
        let favs = surreal.get_user_favorites("user:test_non_existent").await;
        assert!(favs.is_ok());

        // 3. Test get_user_played_list returns Ok vec
        let played = surreal.get_user_played_list("user:test_non_existent").await;
        assert!(played.is_ok());

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

