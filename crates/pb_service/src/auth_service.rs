use crate::surreal_client::SurrealClient;
use pb_core::error::{PbError, PbResult};
use pb_core::models::{AuthResponse, AuthUser, ForwardRequest, ForwardResponse};
use reqwest::{Client, Method};
use std::sync::{Arc, RwLock};
use std::time::Duration;

const DEFAULT_REMOTE_URL: &str = "https://v3.phimbop.cfd";

#[derive(Clone)]
pub struct AuthService {
    client: Client,
    base_url: Arc<RwLock<String>>,
    surreal_client: SurrealClient,
}

impl Default for AuthService {
    fn default() -> Self {
        Self::new(SurrealClient::new())
    }
}

impl AuthService {
    pub fn new(surreal_client: SurrealClient) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_default();

        let base_url = crate::surreal_client::load_env_var_or_file("PUBLIC_WEBSITE_URL")
            .or_else(|| crate::surreal_client::load_env_var_or_file("REMOTE_API_URL"))
            .or_else(|| crate::surreal_client::load_env_var_or_file("API_URL"))
            .or_else(|| crate::surreal_client::load_env_var_or_file("API_DOMAIN"))
            .unwrap_or_else(|| DEFAULT_REMOTE_URL.to_string())
            .trim_end_matches('/')
            .to_string();

        Self {
            client,
            base_url: Arc::new(RwLock::new(base_url)),
            surreal_client,
        }
    }

    pub fn base_url(&self) -> String {
        self.base_url
            .read()
            .map(|l| l.clone())
            .unwrap_or_else(|_| DEFAULT_REMOTE_URL.to_string())
    }

    pub fn set_api_domain(&self, domain: &str) {
        if let Ok(mut lock) = self.base_url.write() {
            *lock = domain.trim_end_matches('/').to_string();
        }
    }

    pub fn surreal_client(&self) -> &SurrealClient {
        &self.surreal_client
    }

    pub async fn login(&self, email: &str, password: &str) -> PbResult<AuthResponse> {
        let req = ForwardRequest {
            method: "POST".to_string(),
            path: "/api/auth/login".to_string(),
            body: Some(serde_json::json!({
                "email": email,
                "password": password
            })),
            token: None,
        };
        let resp = self.forward_remote(req).await?;
        if resp.status == 200 {
            let token = resp.session_token.clone();
            let user: Option<AuthUser> = serde_json::from_value(
                resp.body.get("user").cloned().unwrap_or(resp.body.clone())
            ).ok();
            Ok(AuthResponse {
                success: true,
                token,
                user,
                error: None,
            })
        } else {
            let error = resp.body.get("error").and_then(|e| e.as_str()).map(|s| s.to_string());
            Ok(AuthResponse {
                success: false,
                token: None,
                user: None,
                error: error.or_else(|| Some("Login failed".to_string())),
            })
        }
    }

    pub async fn signup(&self, email: &str, username: &str, password: &str) -> PbResult<AuthResponse> {
        let req = ForwardRequest {
            method: "POST".to_string(),
            path: "/api/auth/signup".to_string(),
            body: Some(serde_json::json!({
                "email": email,
                "username": username,
                "password": password
            })),
            token: None,
        };
        let resp = self.forward_remote(req).await?;
        if resp.status == 200 {
            let token = resp.session_token.clone();
            let user: Option<AuthUser> = serde_json::from_value(
                resp.body.get("user").cloned().unwrap_or(resp.body.clone())
            ).ok();
            Ok(AuthResponse {
                success: true,
                token,
                user,
                error: None,
            })
        } else {
            let error = resp.body.get("error").and_then(|e| e.as_str()).map(|s| s.to_string());
            Ok(AuthResponse {
                success: false,
                token: None,
                user: None,
                error: error.or_else(|| Some("Signup failed".to_string())),
            })
        }
    }

    pub async fn get_me(&self, token: &str) -> PbResult<AuthUser> {
        let req = ForwardRequest {
            method: "GET".to_string(),
            path: "/api/auth/me".to_string(),
            body: None,
            token: Some(token.to_string()),
        };
        let resp = self.forward_remote(req).await?;
        if resp.status == 200 {
            let user_val = resp.body.get("user").cloned().unwrap_or(resp.body);
            serde_json::from_value(user_val).map_err(|e| PbError::Serialization(e.to_string()))
        } else {
            Err(PbError::Unauthorized)
        }
    }

    pub async fn logout(&self, token: Option<&str>) -> PbResult<()> {
        let req = ForwardRequest {
            method: "POST".to_string(),
            path: "/api/auth/logout".to_string(),
            body: None,
            token: token.map(|t| t.to_string()),
        };
        let _ = self.forward_remote(req).await;
        Ok(())
    }

    pub async fn forward_request(&self, req: ForwardRequest) -> PbResult<ForwardResponse> {
        self.forward_remote(req).await
    }

    pub async fn forward_remote(&self, req: ForwardRequest) -> PbResult<ForwardResponse> {
        let method = match req.method.to_uppercase().as_str() {
            "GET" => Method::GET,
            "POST" => Method::POST,
            "PUT" => Method::PUT,
            "DELETE" => Method::DELETE,
            "PATCH" => Method::PATCH,
            _ => Method::GET,
        };

        let path = if req.path.starts_with('/') {
            req.path
        } else {
            format!("/{}", req.path)
        };

        let base_url = self.base_url();
        let url = format!("{}{}", base_url, path);

        let mut builder = self
            .client
            .request(method, &url)
            .header("Origin", &base_url)
            .header("Referer", &base_url)
            .header("Accept", "application/json");

        if let Some(token) = req.token.as_deref().filter(|t: &&str| !t.trim().is_empty()) {
            builder = builder.header("Cookie", format!("session={}", token));
        }

        if let Some(body) = req.body {
            builder = builder.json(&body);
        }

        let response = builder
            .send()
            .await
            .map_err(|e| PbError::Network(format!("Remote API request error: {}", e)))?;

        let status = response.status().as_u16();

        let mut session_token = None;
        for (name, val) in response.headers().iter() {
            if name.as_str().eq_ignore_ascii_case("set-cookie") {
                if let Ok(cookie_str) = val.to_str() {
                    if let Some(idx) = cookie_str.find("session=") {
                        let slice = &cookie_str[idx + 8..];
                        let token_end = slice.find(';').unwrap_or(slice.len());
                        let tok = slice[..token_end].trim();
                        if !tok.is_empty() {
                            session_token = Some(tok.to_string());
                        }
                    }
                }
            }
        }

        let body_val: serde_json::Value = match response.json().await {
            Ok(v) => v,
            Err(_) => serde_json::json!({}),
        };

        Ok(ForwardResponse {
            status,
            body: body_val,
            session_token,
        })
    }
}
