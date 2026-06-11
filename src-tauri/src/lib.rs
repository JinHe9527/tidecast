// Window config (title, size, vibrancy, overlay titlebar, remember size/position)
// lives in tauri.conf.json. On macOS we inset the native traffic lights so they
// sit vertically centered in the 48px (h-12) custom title bar instead of the
// default position, which reads as misaligned against our header content.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_decorum::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                use tauri_plugin_decorum::WebviewWindowExt;
                if let Some(window) = app.get_webview_window("main") {
                    // decorum centers the buttons in a (button_height + y) tall region and
                    // nudges them down 4px, so center-from-top = (button_height + y)/2 + 4.
                    // The title bar is 48px (h-12); y = 26 lands the buttons on its centre.
                    let _ = window.set_traffic_lights_inset(16.0, 26.0);
                    // The custom React header already shows the Tidecast wordmark;
                    // clear the native window title so it isn't drawn twice.
                    let _ = window.set_title("");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
