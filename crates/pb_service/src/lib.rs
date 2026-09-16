pub mod api_client;
pub mod favorite_service;
pub mod history_service;
pub mod keydb_client;
pub mod movie_service;
pub mod surreal_client;

pub use api_client::MovieApiClient;
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
        assert!(ping_res.is_ok());

        let watching_res = service.get_watching_list(10).await;
        println!("Watching list result count: {:?}", watching_res.as_ref().map(|v| v.len()));
        if let Ok(ref items) = watching_res {
            for (i, it) in items.iter().enumerate() {
                println!("  [{}] watching={} movie.name={:?}", i, it.watching, it.movie.get("name"));
            }
        }
        assert!(watching_res.is_ok());
    }
}
