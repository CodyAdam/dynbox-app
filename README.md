# Dynbox desktop app

## Development

This project uses GitHub Actions to automate the release process. When a new tag is pushed to the repository, a GitHub Actions workflow will automatically build the app for Windows, macOS (both Intel and Apple Silicon), and Linux and create a draft release on GitHub with the built artifacts.

### Creating a New Release

1. Make sure your code is ready for release and all changes are committed and pushed to the main branch.

2. Create and push a new tag with a version number:
   ```bash
   git tag v0.1.0  # Replace with your version number
   git push origin v0.1.0
   ```

3. The GitHub Actions workflow will automatically:
   - Build the app for all platforms (Windows, macOS, Linux)
   - Create a draft release on GitHub
   - Generate updater JSON files for auto-updates
   - Upload the built artifacts to the release

4. Go to the GitHub repository's "Releases" section to find the draft release.

5. Review the release, add any additional release notes, and publish it when ready.

For more details, see the [GitHub Actions workflow documentation](.github/README.md).
