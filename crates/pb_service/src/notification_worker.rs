use chrono::Utc;
use pb_core::error::{PbError, PbResult};
use pb_core::models::{AppSettings, MovieUpdateEvent, NotifiedMovie};
use pb_core::traits::FavoriteRepository;
use pb_storage::SqliteStorage;
use reqwest::Client;
use serde::Deserialize;
use std::sync::Arc;
use std::time::Duration;

const DEFAULT_SUPABASE_URL: &str = "https://nhxgdsanykpnmghtohfz.supabase.co";
const DEFAULT_SUPABASE_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeGdkc2FueWtwbm1naHRvaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY1NjYzNTYsImV4cCI6MjAxMjE0MjM1Nn0._M573rGbATQfCvNRLqQHk7dCXSArLo6J_KI2M9HUBd0";

#[derive(Clone)]
pub struct NotificationWorker {
    storage: Arc<SqliteStorage>,
    api_client: crate::MovieApiClient,
    http_client: Client,
    supabase_url: String,
    supabase_key: String,
}

#[derive(Deserialize, Debug)]
struct SupabaseRow {
    #[serde(default)]
    json: Option<Vec<SupabaseMovieItem>>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct SupabaseMovieItem {
    pub name: Option<String>,
    pub slug: Option<String>,
    pub episode_current: Option<String>,
    pub poster_url: Option<String>,
    pub thumb_url: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MovieCandidate {
    pub slug: String,
    pub name: String,
    pub episode: Option<String>,
    pub poster_url: Option<String>,
    pub source: String,
}

impl NotificationWorker {
    pub fn new(storage: Arc<SqliteStorage>, api_client: crate::MovieApiClient) -> Self {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self {
            storage,
            api_client,
            http_client,
            supabase_url: DEFAULT_SUPABASE_URL.to_string(),
            supabase_key: DEFAULT_SUPABASE_KEY.to_string(),
        }
    }

    pub fn with_supabase(
        storage: Arc<SqliteStorage>,
        api_client: crate::MovieApiClient,
        url: String,
        key: String,
    ) -> Self {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self {
            storage,
            api_client,
            http_client,
            supabase_url: url,
            supabase_key: key,
        }
    }

    pub async fn fetch_supabase_new_added(&self) -> PbResult<Vec<SupabaseMovieItem>> {
        let url = format!("{}/rest/v1/new_added?select=*&limit=1", self.supabase_url);
        let resp = self
            .http_client
            .get(&url)
            .header("apikey", &self.supabase_key)
            .header("Authorization", format!("Bearer {}", self.supabase_key))
            .send()
            .await
            .map_err(|e| PbError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!("Supabase error: status {}", resp.status())));
        }

        let rows: Vec<SupabaseRow> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(e.to_string()))?;

        if let Some(first) = rows.into_iter().next() {
            Ok(first.json.unwrap_or_default())
        } else {
            Ok(Vec::new())
        }
    }

    /// Process a batch of candidate movies against SQLite storage to find new movies/episodes
    pub fn process_candidates(
        &self,
        candidates: Vec<MovieCandidate>,
        settings: &AppSettings,
    ) -> PbResult<Vec<MovieUpdateEvent>> {
        let mut updates = Vec::new();

        for candidate in candidates {
            if candidate.slug.trim().is_empty() {
                continue;
            }

            // Filter by favorites only if configured
            if settings.notify_mode == "favorites_only" {
                match self.storage.is_favorite(&candidate.slug) {
                    Ok(true) => {}
                    _ => continue,
                }
            }

            // Check if already notified for this episode
            let already_notified = self
                .storage
                .is_movie_notified(&candidate.slug, candidate.episode.as_deref())?;

            if !already_notified {
                // Check if it is a completely new movie or a new episode of an existing movie
                let is_new_movie = !self
                    .storage
                    .is_movie_notified(&candidate.slug, None)?;

                let event = MovieUpdateEvent {
                    movie_slug: candidate.slug.clone(),
                    movie_name: candidate.name.clone(),
                    episode: candidate.episode.clone(),
                    poster_url: candidate.poster_url.clone(),
                    is_new_movie,
                    source: candidate.source,
                };

                // Mark in SQLite storage as notified
                self.storage.mark_movie_notified(NotifiedMovie {
                    movie_slug: candidate.slug,
                    movie_name: candidate.name,
                    last_episode: candidate.episode,
                    notified_at: Utc::now(),
                })?;

                updates.push(event);
            }
        }

        Ok(updates)
    }

    /// Run a full check against all sources (Supabase + Phim Bo + Phim Le)
    pub async fn check_for_updates(&self) -> PbResult<Vec<MovieUpdateEvent>> {
        let settings = self.storage.get_settings()?;
        if !settings.notify_new_movies {
            return Ok(Vec::new());
        }

        let mut candidates = Vec::new();

        // 1. Fetch from Supabase new_added
        if let Ok(supabase_items) = self.fetch_supabase_new_added().await {
            for item in supabase_items {
                if let (Some(slug), Some(name)) = (item.slug, item.name) {
                    candidates.push(MovieCandidate {
                        slug,
                        name,
                        episode: item.episode_current,
                        poster_url: item.poster_url.or(item.thumb_url),
                        source: "supabase".to_string(),
                    });
                }
            }
        }

        // 2. Fetch from Phim Bo (Series)
        if let Ok(series_res) = self.api_client.get_movies_by_list("phim-bo", 1, 10).await {
            for m in series_res.items {
                candidates.push(MovieCandidate {
                    slug: m.slug,
                    name: m.name,
                    episode: m.episode_current,
                    poster_url: Some(m.poster_url),
                    source: "phim-bo".to_string(),
                });
            }
        }

        // 3. Fetch from Phim Le (Single Movies)
        if let Ok(movies_res) = self.api_client.get_movies_by_list("phim-le", 1, 10).await {
            for m in movies_res.items {
                candidates.push(MovieCandidate {
                    slug: m.slug,
                    name: m.name,
                    episode: m.episode_current,
                    poster_url: Some(m.poster_url),
                    source: "phim-le".to_string(),
                });
            }
        }

        self.process_candidates(candidates, &settings)
    }
}
