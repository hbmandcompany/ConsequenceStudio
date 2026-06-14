use crate::error::{BridgeError, BridgeErrorResponse, BridgeResult};
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

static CONNECTIONS: LazyLock<Mutex<HashMap<String, bool>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub fn connect(connection_id: &str, _url: &str) -> BridgeResult<()> {
    let mut connections = CONNECTIONS.lock().map_err(|_| {
        BridgeErrorResponse::from(BridgeError::Stream(
            "connection registry lock poisoned".into(),
        ))
    })?;
    connections.insert(connection_id.to_string(), true);
    Ok(())
}

pub fn disconnect(connection_id: &str) -> BridgeResult<()> {
    let mut connections = CONNECTIONS.lock().map_err(|_| {
        BridgeErrorResponse::from(BridgeError::Stream(
            "connection registry lock poisoned".into(),
        ))
    })?;
    connections.remove(connection_id);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connect_and_disconnect() {
        connect("test-conn", "ws://localhost:8080").unwrap();
        disconnect("test-conn").unwrap();
    }
}
