use crate::error::{BridgeError, BridgeErrorResponse, BridgeResult};
use serde_json::Value;
use std::fs;
use std::path::Path;

pub fn open_project(path: &str) -> BridgeResult<Value> {
    let content = fs::read_to_string(Path::new(path)).map_err(|e| {
        BridgeErrorResponse::from(BridgeError::Filesystem(format!("failed to read project: {e}")))
    })?;
    serde_json::from_str(&content).map_err(|e| {
        BridgeErrorResponse::from(BridgeError::Filesystem(format!("invalid project JSON: {e}")))
    })
}

pub fn save_project(project_data: Value, path: &str) -> BridgeResult<()> {
    let serialized = serde_json::to_string_pretty(&project_data).map_err(|e| {
        BridgeErrorResponse::from(BridgeError::Filesystem(format!(
            "failed to serialize project: {e}"
        )))
    })?;
    fs::write(Path::new(path), serialized).map_err(|e| {
        BridgeErrorResponse::from(BridgeError::Filesystem(format!("failed to write project: {e}")))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn round_trip_project_file() {
        let dir = std::env::temp_dir().join("consequence-studio-test");
        let _ = fs::create_dir_all(&dir);
        let path = dir.join("test.csproj");
        let data = json!({ "name": "Test", "tempo": 120 });

        save_project(data.clone(), path.to_str().unwrap()).unwrap();
        let loaded = open_project(path.to_str().unwrap()).unwrap();
        assert_eq!(loaded["name"], "Test");
        let _ = fs::remove_file(&path);
    }
}
