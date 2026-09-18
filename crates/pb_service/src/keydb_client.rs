use pb_core::error::{PbError, PbResult};
use pb_core::models::WatchingItem;
use crate::surreal_client::SurrealClient;
use std::sync::{Arc, RwLock};
use std::time::Duration;

const DEFAULT_WEBSITE_URL: &str = "https://v3.phimbop.cfd";

#[derive(Clone)]
pub struct KeydbClient {
    base_url: Arc<RwLock<String>>,
    http_client: reqwest::Client,
}

impl Default for KeydbClient {
    fn default() -> Self {
        Self::new()
    }
}

impl KeydbClient {
    pub fn new() -> Self {
        let base = crate::surreal_client::load_env_var_or_file("PUBLIC_WEBSITE_URL")
            .or_else(|| crate::surreal_client::load_env_var_or_file("API_URL"))
            .or_else(|| crate::surreal_client::load_env_var_or_file("REMOTE_API_URL"))
            .unwrap_or_else(|| DEFAULT_WEBSITE_URL.to_string())
            .trim_end_matches('/')
            .to_string();

        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self {
            base_url: Arc::new(RwLock::new(base)),
            http_client,
        }
    }

    pub fn base_url(&self) -> String {
        self.base_url
            .read()
            .map(|l| l.clone())
            .unwrap_or_else(|_| DEFAULT_WEBSITE_URL.to_string())
    }

    pub fn set_base_url(&self, new_url: &str) {
        if let Ok(mut lock) = self.base_url.write() {
            *lock = new_url.trim_end_matches('/').to_string();
        }
    }

    pub async fn ping(&self) -> PbResult<String> {
        let ping_url = format!("{}/api/watching/list", self.base_url());
        let resp = self
            .http_client
            .head(&ping_url)
            .send()
            .await;

        match resp {
            Ok(r) if r.status().is_success() || r.status().as_u16() == 405 => Ok("PONG".to_string()),
            Ok(_) => Ok("PONG".to_string()),
            Err(e) => Err(PbError::Network(format!("Watching API ping error: {}", e))),
        }
    }

    pub async fn record_heartbeat(&self, movie_id: &str, session_id: &str) -> PbResult<()> {
        let heartbeat_url = format!("{}/api/watching/heartbeat", self.base_url());
        let req_body = serde_json::json!({
            "movieId": movie_id,
            "sessionId": session_id
        });

        let _ = self
            .http_client
            .post(&heartbeat_url)
            .json(&req_body)
            .send()
            .await;

        Ok(())
    }

    pub async fn get_watching_list(
        &self,
        _surreal: &SurrealClient,
        limit: usize,
    ) -> PbResult<Vec<WatchingItem>> {
        let list_url = format!("{}/api/watching/list", self.base_url());
        let resp = self
            .http_client
            .get(&list_url)
            .send()
            .await
            .map_err(|e| PbError::Network(format!("Watching API request failed: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "Watching API status: {}",
                resp.status()
            )));
        }

        let mut items: Vec<WatchingItem> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("Watching API deserialization failed: {}", e)))?;

        if items.len() > limit {
            items.truncate(limit);
        }

        Ok(items)
    }
}
