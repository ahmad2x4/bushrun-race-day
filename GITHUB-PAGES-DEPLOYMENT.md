# GitHub Pages Deployment Guide

Your app will be hosted at: **https://ahmad2x4.github.io/bushrun-race-day/**

## Setup (One-Time)

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository: https://github.com/ahmad2x4/bushrun-race-day
2. Click **Settings** tab
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
5. Save

That's it! GitHub Pages is now enabled.

### Step 2: Push Your Code

```bash
# Make sure you're on main branch
git checkout main

# Add all changes
git add .

# Commit
git commit -m "Add GitHub Pages deployment"

# Push to GitHub
git push origin main
```


## Automatic Deployment

Once you push to the `main` branch:

1. **GitHub Actions runs automatically**
2. Builds your React app
3. Deploys to GitHub Pages
4. Your app goes live at: https://ahmad2x4.github.io/bushrun-race-day/

### Watch the Deployment

1. Go to your repository on GitHub
2. Click **Actions** tab
3. You'll see the deployment workflow running
4. Wait 1-2 minutes for it to complete
5. Visit https://ahmad2x4.github.io/bushrun-race-day/

## Embedding in WordPress

Once deployed to GitHub Pages, you can embed it in your WordPress page:

1. Edit your `/ahmad` page in WordPress
2. Add an **HTML block**
3. Paste this code:

```html
<iframe
  src="https://ahmad2x4.github.io/bushrun-race-day/"
  width="100%"
  height="900"
  style="border: none; min-height: 100vh;"
  title="Bushrun Race Day"
  allow="accelerometer; gyroscope"
></iframe>

<style>
  .wp-block-html iframe {
    width: 100%;
    min-height: 90vh;
  }
</style>
```

4. Publish your page

## Future Updates

To update your app:

1. Make your changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```
4. GitHub Actions automatically rebuilds and redeploys
5. Changes go live in 1-2 minutes

## Manual Deployment (If Needed)

If you want to trigger deployment manually:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select "Deploy to GitHub Pages" workflow
4. Click **Run workflow** button
5. Click the green **Run workflow** button

## Testing Locally

To test the production build locally:

```bash
# Build with GitHub Pages base path
npm run build

# Preview the build
npm run preview
```

Visit http://localhost:4173/bushrun-race-day/ to test.

## Troubleshooting

### Deployment Fails

**Check the Actions tab:**
1. Go to repository → Actions
2. Click on the failed workflow
3. Check the error logs

**Common issues:**
- Build errors: Fix the errors and push again
- Permissions: Make sure GitHub Pages is enabled in Settings

### Page Shows 404

**Solutions:**
1. Check that GitHub Pages source is set to "GitHub Actions"
2. Wait 2-3 minutes after deployment completes
3. Clear browser cache and try again
4. Check the Actions tab to ensure deployment succeeded

### Assets Not Loading

**Solution:**
- This is already handled by the `base: '/bushrun-race-day/'` in vite.config.ts
- If issues persist, check browser console for 404 errors

### WordPress Iframe Issues

**If iframe doesn't show:**
- WordPress.com may block iframes on some plans
- Try the WordPress plugin method instead (see WORDPRESS-PLUGIN.md)

## Benefits of GitHub Pages

✅ **Free hosting** - No cost
✅ **Automatic deployment** - Push to deploy
✅ **Fast CDN** - Global content delivery
✅ **HTTPS included** - Secure by default
✅ **Easy updates** - Just push to GitHub
✅ **Reliable** - 99.9% uptime

## Repository URL

Your app repository: https://github.com/ahmad2x4/bushrun-race-day

## Live URL

Once deployed: **https://ahmad2x4.github.io/bushrun-race-day/**

---

## Quick Commands

```bash
# Test build locally
npm run build && npm run preview

# Deploy to GitHub Pages
git add .
git commit -m "Deploy update"
git push origin main

# Watch deployment
# Go to: https://github.com/ahmad2x4/bushrun-race-day/actions
```

That's it! Your app will be live on GitHub Pages automatically.
