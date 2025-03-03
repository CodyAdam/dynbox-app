#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configuration
const RELEASE_API_URL = "https://api.github.com/repos/CodyAdam/rclone/releases/latest";
const TARGET_DIR = path.join("src-tauri", "bin");
const EXECUTABLE_NAME = "rclone-dynbox";
const IGNORE_SYSTEM = false; // Set to true to download all platform binaries

function getPlatformInfo() {
  const system = os.platform().toLowerCase();
  const arch = os.arch().toLowerCase();
  
  // Map system and architecture to asset name format
  if (system === 'darwin') {
    if (arch === 'arm64') {
      return 'aarch64-apple-darwin';
    } else {
      return 'x86_64-apple-darwin';
    }
  } else if (system === 'win32') {
    return 'x86_64-pc-windows-msvc';
  } else if (system === 'linux') {
    return 'x86_64-unknown-linux-gnu';
  }
  
  // Fallback
  console.log(`Warning: Unsupported platform ${system} ${arch}`);
  return null;
}

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${targetPath}`);
    const file = fs.createWriteStream(targetPath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(targetPath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

async function main() {
  try {
    // Get the script's directory and project root
    const __filename = fileURLToPath(import.meta.url);
    const scriptDir = dirname(__filename);
    console.log(`Script directory: ${scriptDir}`);
    const projectRoot = path.dirname(scriptDir);
    console.log(`Project root: ${projectRoot}`);
    
    // Create target directory with absolute path
    const targetDirAbsolute = path.join(projectRoot, TARGET_DIR);
    if (!fs.existsSync(targetDirAbsolute)) {
      fs.mkdirSync(targetDirAbsolute, { recursive: true });
    }
    
    console.log(`Creating directory: ${targetDirAbsolute}`);
    
    // Get platform information
    const platformTarget = getPlatformInfo();
    if (!platformTarget && !IGNORE_SYSTEM) {
      console.error("Error: Unsupported platform");
      process.exit(1);
    }
    
    console.log(`Detected platform: ${platformTarget || 'Ignored (downloading all)'}`);
    
    // Get release information
    console.log(`Fetching release information from ${RELEASE_API_URL}`);
    
    const releaseInfo = await new Promise((resolve, reject) => {
      const req = https.get(RELEASE_API_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
    });
    
    if (IGNORE_SYSTEM) {
      // Download all assets
      for (const asset of releaseInfo.assets) {
        const assetName = asset.name;
        const downloadUrl = asset.browser_download_url;
        const targetPath = path.join(targetDirAbsolute, assetName);
        
        // Download the binary directly to the target location
        await downloadFile(downloadUrl, targetPath);
        
        // Make the file executable on Unix-like systems
        if (!assetName.endsWith('.exe')) {
          fs.chmodSync(targetPath, 0o755);
        }
        
        console.log(`Successfully installed ${assetName} to ${targetPath}`);
      }
    } else {
      // Find the appropriate asset for the current platform
      let assetName = `rclone-dynbox-${platformTarget}`;
      if (os.platform().toLowerCase() === 'win32') {
        assetName += '.exe';
      }
      
      const matchingAssets = releaseInfo.assets.filter(asset => asset.name === assetName);
      
      if (matchingAssets.length === 0) {
        console.error(`Error: Could not find a release asset matching ${assetName}`);
        process.exit(1);
      }
      
      const asset = matchingAssets[0];
      const downloadUrl = asset.browser_download_url;
      
      // Determine target path with absolute path
      let targetPath;
      if (os.platform().toLowerCase() === 'win32') {
        targetPath = path.join(targetDirAbsolute, `${EXECUTABLE_NAME}.exe`);
      } else {
        targetPath = path.join(targetDirAbsolute, EXECUTABLE_NAME);
      }
      
      // Download the binary directly to the target location
      await downloadFile(downloadUrl, targetPath);
      
      // Make the file executable on Unix-like systems
      if (os.platform().toLowerCase() !== 'win32') {
        fs.chmodSync(targetPath, 0o755);
      }
      
      console.log(`Successfully installed rclone to ${targetPath}`);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
