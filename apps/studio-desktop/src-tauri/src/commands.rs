use crate::audio;
use crate::error::BridgeResult;
use crate::filesystem;
use crate::ipc::SystemInfo;
use crate::midi;
use crate::stream_client;
use serde_json::Value;
use tauri::AppHandle;

#[tauri::command]
pub fn file_open_project(path: String) -> BridgeResult<Value> {
    filesystem::open_project(&path)
}

#[tauri::command]
pub fn file_save_project(project_data: Value, path: String) -> BridgeResult<()> {
    filesystem::save_project(project_data, &path)
}

#[tauri::command]
pub fn midi_enumerate_devices() -> BridgeResult<crate::ipc::MidiDeviceList> {
    midi::enumerate_devices()
}

#[tauri::command]
pub fn midi_open_input(_app: AppHandle, _device_id: String) -> BridgeResult<()> {
    Ok(())
}

#[tauri::command]
pub fn midi_close_input(_device_id: String) -> BridgeResult<()> {
    Ok(())
}

#[tauri::command]
pub fn midi_send_output(device_id: String, message: Vec<u8>) -> BridgeResult<()> {
    midi::send_output(&device_id, message)
}

#[tauri::command]
pub fn stream_connect(url: String, params: Value) -> BridgeResult<()> {
    let connection_id = params
        .get("connection_id")
        .and_then(|v| v.as_str())
        .unwrap_or("default");
    stream_client::connect(connection_id, &url)
}

#[tauri::command]
pub fn stream_disconnect(connection_id: String) -> BridgeResult<()> {
    stream_client::disconnect(&connection_id)
}

#[tauri::command]
pub fn native_get_system_info() -> BridgeResult<SystemInfo> {
    let _ = audio::init_audio();
    let mut sys = sysinfo::System::new();
    sys.refresh_memory();
    Ok(SystemInfo {
        cpu_count: num_cpus::get(),
        memory_total_mb: sys.total_memory() / 1024 / 1024,
        platform: std::env::consts::OS.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
    })
}

#[tauri::command]
pub fn poet_get_session_state(session_id: String) -> BridgeResult<serde_json::Value> {
    let base = std::env::var("POET_HTTP_URL").unwrap_or_else(|_| "http://localhost:8001".to_string());
    let url = format!("{}/sessions/{}", base.trim_end_matches('/'), session_id);
    let response = reqwest::blocking::get(&url).map_err(|e| crate::error::BridgeErrorResponse {
        code: "poet_http_error".to_string(),
        message: e.to_string(),
    })?;
    if !response.status().is_success() {
        return Err(crate::error::BridgeErrorResponse {
            code: "poet_http_error".to_string(),
            message: format!("Poet session fetch failed: {}", response.status()),
        });
    }
    response
        .json::<serde_json::Value>()
        .map_err(|e| crate::error::BridgeErrorResponse {
            code: "poet_parse_error".to_string(),
            message: e.to_string(),
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_info_returns_valid_data() {
        let info = native_get_system_info().unwrap();
        assert!(info.cpu_count > 0);
        assert!(!info.platform.is_empty());
    }
}
