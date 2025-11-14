# Deployment Guide

## GitHub Pages (Recommended - Easiest)

Your app is configured to automatically deploy to GitHub Pages.

**Live URL:** https://ahmad2x4.github.io/bushrun-race-day/

### Quick Start

1. **Enable GitHub Pages** (one-time setup):
   - Go to repository Settings → Pages
   - Source: Select "GitHub Actions"
   - Save

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Done!** Your app will be live in 1-2 minutes

See [GITHUB-PAGES-DEPLOYMENT.md](GITHUB-PAGES-DEPLOYMENT.md) for detailed instructions.

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

---

## WordPress Plugin (Alternative)

If you prefer a WordPress plugin instead:

```bash
npm run build:wp-plugin
```

See [WORDPRESS-PLUGIN.md](WORDPRESS-PLUGIN.md) for details.

---

## AWS CloudFront (Current Production)

Your existing AWS infrastructure deployment:

```bash
npm run deploy:build
```

See `iac/` folder for infrastructure code.
