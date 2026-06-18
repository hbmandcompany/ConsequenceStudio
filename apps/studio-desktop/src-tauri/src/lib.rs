mod audio;
mod commands;
mod error;
mod filesystem;
mod ipc;
mod midi;
mod stream_client;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::file_open_project,
            commands::file_save_project,
            commands::midi_enumerate_devices,
            commands::midi_open_input,
            commands::midi_close_input,
            commands::midi_send_output,
            commands::stream_connect,
            commands::stream_disconnect,
            commands::native_get_system_info,
            commands::poet_get_session_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ConsequenceStudio");
}
