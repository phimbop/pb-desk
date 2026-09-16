use crate::surreal_client::SurrealClient;
use pb_core::error::{PbError, PbResult};
use pb_core::models::{AuthResponse, AuthUser, ForwardRequest, ForwardResponse};
use reqwest::{Client, Method};
use std::time::Duration;

const DEFAULT_REMOTE_URL: &str = "https://v3.phimbop.cfd";

#[derive(Clone)]
pub struct AuthService {
    client: Client,
    base_url: String,
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

        let base_url = crate::surreal_client::load_env_var_or_file("REMOTE_API_URL")
            .unwrap_or_else(|| DEFAULT_REMOTE_URL.to_string());

        Self {
            client,
            base_url,
            surreal_client,
        }
    }

    pub fn surreal_client(&self) -> &SurrealClient {
        &self.surreal_client
    }

    pub async fn login(&self, email: &str, password: &str) -> PbResult<AuthResponse> {
        self.surreal_client.auth_signin(email, password).await
    }

    pub async fn signup(&self, email: &str, username: &str, password: &str) -> PbResult<AuthResponse> {
        self.surreal_client.auth_signup(email, username, password).await
    }

    pub async fn get_me(&self, token: &str) -> PbResult<AuthUser> {
        self.surreal_client.auth_get_me(token).await
    }

    pub async fn logout(&self, _token: Option<&str>) -> PbResult<()> {
        Ok(())
    }

    pub async fn forward_request(&self, req: ForwardRequest) -> PbResult<ForwardResponse> {
        let path_clean = req.path.trim_start_matches('/');

        // 1. Native handler for /api/user/favorites
        if path_clean == "api/user/favorites" {
            let user = match req.token.as_deref() {
                Some(t) => self.surreal_client.auth_get_me(t).await.ok(),
                None => None,
            };
            let user = match user {
                Some(u) => u,
                None => {
                    return Ok(ForwardResponse {
                        status: 401,
                        body: serde_json::json!({ "error": "Unauthorized" }),
                        session_token: None,
                    });
                }
            };

            if req.method.eq_ignore_ascii_case("GET") {
                let favorites = self.surreal_client.get_user_favorites(&user.id).await?;
                return Ok(ForwardResponse {
                    status: 200,
                    body: serde_json::Value::Array(favorites),
                    session_token: None,
                });
            } else if req.method.eq_ignore_ascii_case("POST") {
                if let Some(body) = req.body {
                    let movie = body.get("movie");
                    let action = body.get("action").and_then(|v| v.as_str());
                    if let (Some(m), Some(act)) = (movie, action) {
                        if act == "add" {
                            self.surreal_client.add_user_favorite(&user.id, m).await?;
                        } else {
                            let m_id = m.get("_id").and_then(|v| v.as_str())
                                .or_else(|| m.get("id").and_then(|v| v.as_str()))
                                .or_else(|| m.get("slug").and_then(|v| v.as_str()))
                                .unwrap_or("");
                            let id_owned: String;
                            let m_id_str = if m_id.is_empty() {
                                if let Some(n) = m.get("id").and_then(|v| v.as_i64()) {
                                    id_owned = n.to_string();
                                    &id_owned
                                } else {
                                    m_id
                                }
                            } else {
                                m_id
                            };
                            self.surreal_client.remove_user_favorite(&user.id, m_id_str).await?;
                        }
                        return Ok(ForwardResponse {
                            status: 200,
                            body: serde_json::json!({ "success": true }),
                            session_token: None,
                        });
                    }
                }
                return Ok(ForwardResponse {
                    status: 400,
                    body: serde_json::json!({ "error": "Invalid request body" }),
                    session_token: None,
                });
            }
        }

        // 2. Native handler for /api/user/played-list
        if path_clean == "api/user/played-list" {
            let user = match req.token.as_deref() {
                Some(t) => self.surreal_client.auth_get_me(t).await.ok(),
                None => None,
            };
            let user = match user {
                Some(u) => u,
                None => {
                    return Ok(ForwardResponse {
                        status: 401,
                        body: serde_json::json!({ "error": "Unauthorized" }),
                        session_token: None,
                    });
                }
            };

            if req.method.eq_ignore_ascii_case("GET") {
                let played = self.surreal_client.get_user_played_list(&user.id).await?;
                return Ok(ForwardResponse {
                    status: 200,
                    body: serde_json::Value::Array(played),
                    session_token: None,
                });
            }
        }

        // 3. Native handler for /api/auth/migrate
        if path_clean == "api/auth/migrate" {
            let user = match req.token.as_deref() {
                Some(t) => self.surreal_client.auth_get_me(t).await.ok(),
                None => None,
            };
            let user = match user {
                Some(u) => u,
                None => {
                    return Ok(ForwardResponse {
                        status: 401,
                        body: serde_json::json!({ "error": "Unauthorized" }),
                        session_token: None,
                    });
                }
            };

            if let Some(body) = req.body {
                let empty_vec = Vec::new();
                let played_list = body.get("played_list").and_then(|v| v.as_array()).unwrap_or(&empty_vec);
                let favorites = body.get("favorites").and_then(|v| v.as_array()).unwrap_or(&empty_vec);
                let (migrated_p, migrated_f) = self.surreal_client.migrate_user_data(&user.id, played_list, favorites).await?;
                return Ok(ForwardResponse {
                    status: 200,
                    body: serde_json::json!({
                        "success": true,
                        "migrated": {
                            "played": migrated_p,
                            "favorites": migrated_f
                        }
                    }),
                    session_token: None,
                });
            }
        }

        // 4. Native handler for /api/auth/login, signup, me
        if path_clean == "api/auth/login" {
            if let Some(body) = req.body {
                let email = body.get("email").and_then(|v| v.as_str()).unwrap_or("");
                let password = body.get("password").and_then(|v| v.as_str()).unwrap_or("");
                let res = self.login(email, password).await?;
                if res.success {
                    return Ok(ForwardResponse {
                        status: 200,
                        body: serde_json::json!({
                            "token": res.token,
                            "user": res.user
                        }),
                        session_token: res.token,
                    });
                } else {
                    return Ok(ForwardResponse {
                        status: 400,
                        body: serde_json::json!({
                            "error": res.error.unwrap_or_else(|| "Login failed".to_string())
                        }),
                        session_token: None,
                    });
                }
            }
        }

        if path_clean == "api/auth/signup" {
            if let Some(body) = req.body {
                let email = body.get("email").and_then(|v| v.as_str()).unwrap_or("");
                let username = body.get("username").and_then(|v| v.as_str()).unwrap_or("");
                let password = body.get("password").and_then(|v| v.as_str()).unwrap_or("");
                let res = self.signup(email, username, password).await?;
                if res.success {
                    return Ok(ForwardResponse {
                        status: 200,
                        body: serde_json::json!({
                            "token": res.token,
                            "user": res.user
                        }),
                        session_token: res.token,
                    });
                } else {
                    return Ok(ForwardResponse {
                        status: 400,
                        body: serde_json::json!({
                            "error": res.error.unwrap_or_else(|| "Signup failed".to_string())
                        }),
                        session_token: None,
                    });
                }
            }
        }

        if path_clean == "api/auth/me" {
            if let Some(token) = req.token.as_deref() {
                if let Ok(user) = self.get_me(token).await {
                    return Ok(ForwardResponse {
                        status: 200,
                        body: serde_json::json!({ "user": user }),
                        session_token: Some(token.to_string()),
                    });
                }
            }
            return Ok(ForwardResponse {
                status: 401,
                body: serde_json::json!({ "error": "Unauthorized" }),
                session_token: None,
            });
        }

        // 5. Fallback for other routes (comments, ratings, playlists, notifications)
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

        let url = format!("{}{}", self.base_url, path);

        let mut builder = self
            .client
            .request(method, &url)
            .header("Origin", &self.base_url)
            .header("Referer", &self.base_url)
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
