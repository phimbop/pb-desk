use thiserror::Error;

#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum PbError {
    #[error("Entity not found: {0}")]
    NotFound(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Invalid argument: {0}")]
    InvalidArgument(String),

    #[error("Internal service error: {0}")]
    Internal(String),

    #[error("Unauthorized")]
    Unauthorized,
}

pub type PbResult<T> = Result<T, PbError>;
