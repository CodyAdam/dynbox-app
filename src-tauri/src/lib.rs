use std::env;
use tauri::{AppHandle, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

mod authorize;

use crate::authorize::process_auth_urls;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(
            |app: &AppHandle, argv, _cwd| {
                // Focus the main window when a new instance is launched
                let _ = app
                    .get_webview_window("main")
                    .expect("no main window")
                    .set_focus();
                // For runtime-registered schemes like "dynbox", we need to manually check argv
                for arg in argv {
                    if arg.starts_with("dynbox://") {
                        // Process the URL if it matches our expected format
                        if let Ok(url) = url::Url::parse(&arg) {
                            if url.scheme() == "dynbox" {
                                let _ = process_auth_urls(app.clone(), vec![url]);
                            }
                        }
                    }
                }
            },
        ));
    }

    #[cfg(not(desktop))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init());
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            #[cfg(desktop)]
            app.deep_link().register("dynbox")?;

            // Register the deep link handler
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                let _ = process_auth_urls(handle.clone(), urls);
            });

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(desktop)]
            let _ = app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                None,
            ));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
