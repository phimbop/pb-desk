pub mod dto;

pub use dto::*;

#[cfg(test)]
mod tests {
    use super::*;
    use pb_core::models::Movie;

    #[test]
    fn test_dto_conversion() {
        let movie = Movie {
            id: "123".to_string(),
            name: "Test Movie".to_string(),
            slug: "test-movie".to_string(),
            origin_name: "Test Movie Origin".to_string(),
            thumb_url: "thumb.jpg".to_string(),
            poster_url: "poster.jpg".to_string(),
            year: Some(2025),
            quality: Some("FHD".to_string()),
            lang: Some("Vietsub".to_string()),
            time: Some("120m".to_string()),
            episode_current: Some("Tap 1".to_string()),
        };

        let ipc_movie: IpcMovie = movie.into();
        assert_eq!(ipc_movie.slug, "test-movie");
        assert_eq!(ipc_movie.year, Some(2025));

        let res = IpcResponse::ok(ipc_movie);
        assert!(res.success);
        assert!(res.data.is_some());
    }
}
