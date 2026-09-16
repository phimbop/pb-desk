use pb_core::error::PbResult;
use pb_core::models::{FavoriteMovieItem, PaginatedResult};
use pb_core::traits::FavoriteRepository;
use std::sync::Arc;

pub struct FavoriteService {
    repo: Arc<dyn FavoriteRepository>,
}

impl FavoriteService {
    pub fn new(repo: Arc<dyn FavoriteRepository>) -> Self {
        Self { repo }
    }

    pub fn get_favorites(&self, page: u32, limit: u32) -> PbResult<PaginatedResult<FavoriteMovieItem>> {
        self.repo.get_favorites(page, limit)
    }

    pub fn add_favorite(&self, item: FavoriteMovieItem) -> PbResult<()> {
        self.repo.add_favorite(item)
    }

    pub fn remove_favorite(&self, movie_slug: &str) -> PbResult<()> {
        self.repo.remove_favorite(movie_slug)
    }

    pub fn toggle_favorite(&self, item: FavoriteMovieItem) -> PbResult<bool> {
        let is_fav = self.repo.is_favorite(&item.movie_slug)?;
        if is_fav {
            self.repo.remove_favorite(&item.movie_slug)?;
            Ok(false)
        } else {
            self.repo.add_favorite(item)?;
            Ok(true)
        }
    }

    pub fn is_favorite(&self, movie_slug: &str) -> PbResult<bool> {
        self.repo.is_favorite(movie_slug)
    }
}
