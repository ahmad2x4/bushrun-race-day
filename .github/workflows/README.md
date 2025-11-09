# GitHub Actions Workflows

## Deploy to S3

Automatically builds and deploys to https://bbr.home.ahmadreza.com when a git tag is pushed.

### Setup Required

1. **GitHub Secret**: Add `AWS_DEPLOY_ROLE_ARN` secret with your IAM role ARN
2. **AWS IAM Role**: Must have permissions for S3 write, CloudFront invalidation, and trust GitHub OIDC

### How It Works

- Triggers on git tags matching `v*` (e.g., `v1.0.0`, `v1.0.1`)
- Extracts version from git tag
- Runs linter (`npm run lint`)
- Runs unit tests (`npm test`)
- Builds app with version injected (`npm run build`)
- Uploads to S3 bucket (auto-discovered from "bushrunners-spa" name)
- Invalidates CloudFront cache
- Static assets cached for 1 year, HTML files not cached

### Creating a Release

**Option 1: Manual tag creation**
```bash
git tag v1.0.1
git push origin v1.0.1
```

**Option 2: Use npm scripts (recommended)**
```bash
npm run release:patch  # 1.0.0 → 1.0.1 (bug fixes)
npm run release:minor  # 1.0.0 → 1.1.0 (new features)
npm run release:major  # 1.0.0 → 2.0.0 (breaking changes)
```

### Manual Deploy

Actions tab → Deploy to S3 → Run workflow

### Version Display

The app version is automatically displayed at the bottom of the Settings page.
