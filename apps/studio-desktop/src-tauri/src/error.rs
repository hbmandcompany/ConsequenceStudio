use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BridgeError {
    #[error("filesystem error: {0}")]
    Filesystem(String),
    #[error("midi error: {0}")]
    Midi(String),
    #[error("stream error: {0}")]
    Stream(String),
    #[error("audio error: {0}")]
    Audio(String),
    #[error("internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BridgeErrorResponse {
    pub code: String,
    pub message: String,
}

impl From<BridgeError> for BridgeErrorResponse {
    fn from(err: BridgeError) -> Self {
        let code = match &err {
            BridgeError::Filesystem(_) => "FILESYSTEM",
            BridgeError::Midi(_) => "MIDI",
            BridgeError::Stream(_) => "STREAM",
            BridgeError::Audio(_) => "AUDIO",
            BridgeError::Internal(_) => "INTERNAL",
        };
        BridgeErrorResponse {
            code: code.to_string(),
            message: err.to_string(),
        }
    }
}

pub type BridgeResult<T> = Result<T, BridgeErrorResponse>;
