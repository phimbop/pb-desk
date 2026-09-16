use pb_core::error::{PbError, PbResult};
use pb_core::models::AdultMovieRecord;
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;

const DEFAULT_SURREAL_URL: &str = "https://srv2.phimbop.cfd/sql";
const DEFAULT_SURREAL_NS: &str = "pb";
const DEFAULT_SURREAL_DB: &str = "pbdb";
const DEFAULT_AUTH_BASIC: &str = "Basic cm9vdDpyb290";

#[derive(Clone)]
pub struct SurrealClient {
    client: Client,
    url: String,
    ns: String,
    db: String,
    auth: String,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct SurrealSqlResponse {
    #[serde(default)]
    result: Option<Vec<AdultMovieRecord>>,
    #[serde(default)]
    status: Option<String>,
}

impl Default for SurrealClient {
    fn default() -> Self {
        Self::new()
    }
}

impl SurrealClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_default();

        let url = std::env::var("SURREAL_URL")
            .or_else(|_| std::env::var("DB_ENDPOINT"))
            .unwrap_or_else(|_| DEFAULT_SURREAL_URL.to_string());

        let ns = std::env::var("SURREAL_NS")
            .or_else(|_| std::env::var("DB_NS"))
            .unwrap_or_else(|_| DEFAULT_SURREAL_NS.to_string());

        let db = std::env::var("SURREAL_DB")
            .or_else(|_| std::env::var("DB_DB"))
            .unwrap_or_else(|_| DEFAULT_SURREAL_DB.to_string());

        let auth = DEFAULT_AUTH_BASIC.to_string();

        Self {
            client,
            url,
            ns,
            db,
            auth,
        }
    }

    pub async fn get_adult_movies(&self) -> PbResult<Vec<AdultMovieRecord>> {
        let query = "SELECT * FROM top_movie_list WHERE is_18 = true;";
        let resp = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Authorization", &self.auth)
            .header("Accept", "application/json")
            .body(query)
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "SurrealDB HTTP status: {}",
                resp.status()
            )));
        }

        let body: Vec<SurrealSqlResponse> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB deserialization error: {}", e)))?;

        let movies = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        Ok(movies)
    }

    pub async fn get_movies_by_ids(&self, ids: &[String]) -> PbResult<Vec<AdultMovieRecord>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }

        let record_ids: Vec<String> = ids
            .iter()
            .map(|id| {
                if id.starts_with("top_movie_list:") {
                    id.clone()
                } else if id.chars().all(|c| c.is_ascii_digit()) {
                    format!("top_movie_list:{}", id)
                } else {
                    format!("top_movie_list:⟨{}⟩", id)
                }
            })
            .collect();

        let query = format!(
            "SELECT * FROM top_movie_list WHERE id IN [{}];",
            record_ids.join(", ")
        );

        let resp = self
            .client
            .post(&self.url)
            .header("surreal-ns", &self.ns)
            .header("surreal-db", &self.db)
            .header("Authorization", &self.auth)
            .header("Accept", "application/json")
            .body(query)
            .send()
            .await
            .map_err(|e| PbError::Network(format!("SurrealDB request error: {}", e)))?;

        if !resp.status().is_success() {
            return Err(PbError::Network(format!(
                "SurrealDB HTTP status: {}",
                resp.status()
            )));
        }

        let body: Vec<SurrealSqlResponse> = resp
            .json()
            .await
            .map_err(|e| PbError::Serialization(format!("SurrealDB deserialization error: {}", e)))?;

        let movies = body
            .into_iter()
            .next()
            .and_then(|r| r.result)
            .unwrap_or_default();

        Ok(movies)
    }
}
