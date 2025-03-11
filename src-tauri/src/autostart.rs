use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

/// Toggles the application's autostart setting.
/// 
/// Returns the new autostart state after toggling (true if enabled, false if disabled).
pub fn toggle_autostart(app: &AppHandle) -> Result<bool, Box<dyn std::error::Error>> {
    let autostart_manager = app.autolaunch();
    
    let is_enabled = autostart_manager.is_enabled()?;
    
    if is_enabled {
        autostart_manager.disable()?;
    } else {
        autostart_manager.enable()?;
    }
    
    // Return the new state
    Ok(!is_enabled)
}

/// Gets the current autostart state of the application.
/// 
/// Returns true if autostart is enabled, false otherwise.
pub fn get_autostart_state(app: &AppHandle) -> Result<bool, Box<dyn std::error::Error>> {
    let autostart_manager = app.autolaunch();
    Ok(autostart_manager.is_enabled()?)
}
