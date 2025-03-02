# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating various tasks in the Dynbox App repository.

## Release Workflow

The `release.yml` workflow automates the process of building and releasing the Dynbox App when a new tag is pushed to the repository.

### How to Create a New Release

1. Make sure your code is ready for release and all changes are committed and pushed to the main branch.

2. Create and push a new tag with a version number:
   ```bash
   git tag v0.1.0  # Replace with your version number
   git push origin v0.1.0
   ```

3. The GitHub Actions workflow will automatically:
   - Build the app for Windows, macOS (both Intel and Apple Silicon), and Linux
   - Create a draft release on GitHub with the built artifacts
   - Generate updater JSON files for auto-updates
   - Upload the artifacts to the release

4. Go to the GitHub repository's "Releases" section to find the draft release.

5. Review the release, add any additional release notes, and publish it when ready.

### Workflow Details

The workflow uses the official [tauri-apps/tauri-action](https://github.com/tauri-apps/tauri-action) to build and release the app. It builds:

- Windows: MSI and NSIS installer
- macOS: Both Intel (x86_64) and Apple Silicon (aarch64) builds
- Linux: Debian package and AppImage

### Versioning

Follow semantic versioning (MAJOR.MINOR.PATCH) for your tags:
- `v1.0.0` - First major release
- `v1.1.0` - Minor release with new features
- `v1.1.1` - Patch release with bug fixes

Always prefix your version with `v` (e.g., `v1.0.0`) to trigger the workflow. 