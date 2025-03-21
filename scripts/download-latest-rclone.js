#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configuration
const RELEASE_API_URL = "https://api.github.com/repos/CodyAdam/rclone/releases/latest";
const TARGET_DIR = path.join("src-tauri", "bin");
const IGNORE_SYSTEM = false; // Set to true to download all platform binaries

function getPlatformInfo() {
  const system = os.platform().toLowerCase();
  const arch = os.arch().toLowerCase();
  
  // All supported platform targets
  const allPlatforms = [
    'aarch64-apple-darwin',
    'x86_64-apple-darwin',
    'x86_64-pc-windows-msvc',
    'x86_64-unknown-linux-gnu'
  ];
  
  // If IGNORE_SYSTEM is true, return all platforms
  if (IGNORE_SYSTEM) {
    return allPlatforms;
  }
  
  // Map system and architecture to asset name format
  if (system === 'darwin') {
    return ['aarch64-apple-darwin', 'x86_64-apple-darwin'];
  } else if (system === 'win32') {
    return ['x86_64-pc-windows-msvc'];
  } else if (system === 'linux') {
    return ['x86_64-unknown-linux-gnu'];
  }
  
  // Fallback
  console.log(`Warning: Unsupported platform ${system} ${arch}`);
  return [];
}

async function downloadFile(url, targetPath) {
  console.log(`Downloading ${url} to ${targetPath}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(targetPath);
    const buffer = await response.arrayBuffer();
    
    return new Promise((resolve, reject) => {
      fileStream.write(Buffer.from(buffer));
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(targetPath, () => {}); // Delete the file if there was an error
        reject(err);
      });
      fileStream.end();
    });
  } catch (error) {
    fs.unlink(targetPath, () => {}); // Delete the file if there was an error
    throw error;
  }
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
    const platformTargets = getPlatformInfo();
    if (platformTargets.length === 0) {
      console.error("Error: Unsupported platform");
      process.exit(1);
    }
    
    console.log(`Detected platforms: ${platformTargets.join(', ')}`);
    
    // Get release information
    console.log(`Fetching release information from ${RELEASE_API_URL}`);
    
    // Use GITHUB_TOKEN for authentication if available (in GitHub Actions)
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (process.env.GITHUB_TOKEN) {
      console.log('Using GITHUB_TOKEN for API authentication');
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    
    const response = await fetch(RELEASE_API_URL, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch release info: ${response.status} ${response.statusText}`);
    }
    
    const releaseInfo = await response.json();
    
    // Check if releaseInfo has assets
    if (!releaseInfo || !releaseInfo.assets || !Array.isArray(releaseInfo.assets)) {
      console.error("Error: Invalid release information received from GitHub API");
      console.error("Response:", JSON.stringify(releaseInfo, null, 2));
      process.exit(1);
    }
    
    // Download assets for each platform target
    for (const platformTarget of platformTargets) {
      let assetName = `rclone-dynbox-${platformTarget}`;
      if (platformTarget === 'x86_64-pc-windows-msvc') {
        assetName += '.exe';
      }
      
      const matchingAssets = releaseInfo.assets.filter(asset => asset.name === assetName);
      
      if (matchingAssets.length === 0) {
        console.error(`Error: Could not find a release asset matching ${assetName}`);
        console.error("Available assets:", releaseInfo.assets.map(a => a.name).join(", "));
        continue;
      }
      
      const asset = matchingAssets[0];
      const downloadUrl = asset.browser_download_url;
      const targetPath = path.join(targetDirAbsolute, asset.name);
      
      // Download the binary directly to the target location
      await downloadFile(downloadUrl, targetPath);
      
      // Make the file executable on Unix-like systems
      if (!asset.name.endsWith('.exe')) {
        fs.chmodSync(targetPath, 0o755);
      }
      
      console.log(`Successfully installed rclone (${platformTarget}) to ${targetPath}`);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
