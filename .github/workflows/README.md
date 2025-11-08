# GitHub Actions Workflows

## Deploy to S3

Automatically builds and deploys to https://bbr.home.ahmadreza.com on push to `main` branch.

### Setup Required

1. **GitHub Secret**: Add `AWS_DEPLOY_ROLE_ARN` secret with your IAM role ARN
2. **AWS IAM Role**: Must have permissions for S3 write, CloudFront invalidation, and trust GitHub OIDC

### How It Works

- Runs linter (`npm run lint`)
- Runs unit tests (`npm test`)
- Builds app with `npm run build`
- Uploads to S3 bucket (auto-discovered from "bushrunners-spa" name)
- Invalidates CloudFront cache
- Static assets cached for 1 year, HTML files not cached

### Manual Deploy

Actions tab → Deploy to S3 → Run workflow
