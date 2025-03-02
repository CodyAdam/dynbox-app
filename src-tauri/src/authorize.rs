use serde_json::json;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use url::Url;

/// Extracts the authorization token from a list of URLs and stores it in the Tauri store.
///
/// This function looks for URLs with the format `dynbox://authorize?token={token}`,
/// extracts the token, and saves it to the application's store.
pub fn process_auth_urls(app: AppHandle, urls: Vec<Url>) -> Result<(), String> {
    for url in urls {
        println!("Processing URL: {}", url);
        if url.scheme() == "dynbox" && url.authority() == "authorize" {
            // Parse the query parameters
            if let Some(token) = url
                .query_pairs()
                .find(|(key, _)| key == "token")
                .map(|(_, value)| value.to_string())
            {
                // Store the token
                let store = app.store("config.json").map_err(|e| e.to_string())?;
                store.set("token", json!(token));

                // Save changes to disk
                store.save().map_err(|e| e.to_string())?;

                println!("Token saved: {}", token);
                return Ok(());
            }
        }
    }

    // No token found in any of the URLs
    Ok(())
}
