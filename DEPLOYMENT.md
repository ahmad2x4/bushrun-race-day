# Deployment Guide

## GitHub Pages (Automatic Deployment)

Your app is configured to automatically deploy to GitHub Pages with semantic versioning.

**Live URL:** https://ahmad2x4.github.io/bushrun-race-day/

### Quick Start

1. **Enable GitHub Pages** (one-time setup - already done):
   - Go to repository Settings → Pages
   - Source: Select "GitHub Actions"
   - Save

2. **Deploy**:
   ```bash
   git add .
   git commit -m "feat: your changes here"
   git push origin main
   ```

3. **Done!**
   - GitHub Actions will automatically build and deploy
   - Semantic version will be calculated and tagged
   - Release will be created with changelog
   - App will be live in 2-3 minutes

### Versioning

- Every push automatically bumps the **patch** version (1.0.1 → 1.0.2)
- Include `(MINOR)` in commit message for minor version bump (1.0.2 → 1.1.0)
- Include `(MAJOR)` in commit message for major version bump (1.1.0 → 2.0.0)

See [VERSIONING.md](VERSIONING.md) for detailed versioning guide.

See [GITHUB-PAGES-DEPLOYMENT.md](GITHUB-PAGES-DEPLOYMENT.md) for detailed deployment instructions.

---

## WordPress Integration

Once deployed to GitHub Pages, embed in WordPress:

```html
<iframe
  src="https://ahmad2x4.github.io/bushrun-race-day/"
  width="100%"
  height="900"
  style="border: none; min-height: 100vh;"
  title="Bushrun Race Day"
></iframe>
```

See [GITHUB-PAGES-DEPLOYMENT.md](GITHUB-PAGES-DEPLOYMENT.md) for WordPress embedding details.
