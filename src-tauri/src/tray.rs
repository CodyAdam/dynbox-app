use crate::autostart;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_opener::OpenerExt;

pub fn create_tray_menu(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_window_item = MenuItem::with_id(app, "open_window", "Open", true, None::<&str>)?;
    let open_web_item = MenuItem::with_id(app, "open_web", "Open in web", true, None::<&str>)?;
    let auto_start_item = CheckMenuItem::with_id(
        app,
        "auto_start",
        "Launch at startup",
        true,
        autostart::get_autostart_state(app)?,
        None::<&str>,
    )?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Dynbox", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &open_window_item,
            &open_web_item,
            &auto_start_item,
            &quit_item,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "open_web" => {
                if let Err(e) = app.opener().open_url("https://dynbox.co", None::<&str>) {
                    eprintln!("Failed to open web URL: {}", e);
                }
            }
            "auto_start" => match autostart::toggle_autostart(app) {
                Ok(new_state) => println!("Auto start: {}", new_state),
                Err(e) => eprintln!("Failed to toggle autostart: {:?}", e),
            },
            "open_window" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                println!("left click pressed and released");
                // in this example, let's show and focus the main window when the tray is clicked
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {
                println!("unhandled event {event:?}");
            }
        })
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;

    Ok(())
}
