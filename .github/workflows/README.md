# GitHub Actions Workflows

## Deploy to GitHub Pages

Automatically builds and deploys to https://ahmad2x4.github.io/bushrun-race-day/ when code is pushed to the main branch.

### How It Works

- Triggers on push to `main` branch or manual workflow dispatch
- Installs Node.js dependencies
- Builds the React app (`npm run build`)
- Uploads the `dist/` folder to GitHub Pages
- Deploys automatically

### Setup

1. Go to repository Settings → Pages
2. Under "Build and deployment", select **Source: GitHub Actions**
3. Push to main branch to trigger deployment

That's it! GitHub Actions handles everything automatically.

### Manual Trigger

You can also trigger the workflow manually:
1. Go to Actions tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
