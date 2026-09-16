pub mod error;
pub mod models;
pub mod traits;

pub use error::{PbError, PbResult};
pub use models::*;
pub use traits::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_domain_model_instantiation() {
        let movie = Movie {
            id: "1".to_string(),
            name: "Test Movie".to_string(),
            slug: "test-movie".to_string(),
            origin_name: "Original Name".to_string(),
            thumb_url: "thumb.jpg".to_string(),
            poster_url: "poster.jpg".to_string(),
            year: Some(2025),
            quality: Some("HD".to_string()),
            lang: Some("Vietsub".to_string()),
            time: Some("120 phút".to_string()),
            episode_current: Some("Tập 1".to_string()),
        };
        assert_eq!(movie.slug, "test-movie");
        assert_eq!(movie.year, Some(2025));
    }
}
