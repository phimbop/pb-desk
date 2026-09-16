use pb_core::error::PbResult;
use pb_core::models::WatchHistoryItem;
use pb_core::traits::HistoryRepository;
use std::sync::Arc;

pub struct HistoryService {
    repo: Arc<dyn HistoryRepository>,
}

impl HistoryService {
    pub fn new(repo: Arc<dyn HistoryRepository>) -> Self {
        Self { repo }
    }

    pub fn get_history(&self, limit: u32) -> PbResult<Vec<WatchHistoryItem>> {
        self.repo.get_history(limit)
    }

    pub fn save_history(&self, item: WatchHistoryItem) -> PbResult<()> {
        self.repo.save_history(item)
    }

    pub fn delete_history(&self, movie_slug: &str) -> PbResult<()> {
        self.repo.delete_history(movie_slug)
    }

    pub fn clear_history(&self) -> PbResult<()> {
        self.repo.clear_history()
    }
}
