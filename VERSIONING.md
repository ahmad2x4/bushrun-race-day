# Semantic Versioning Guide

This project uses automatic semantic versioning with GitHub Actions.

## How It Works

### Automatic Patch Bumps (Default)

Every push to `main` branch **automatically increments the patch version**:

```
1.0.1 → 1.0.2 → 1.0.3 → ...
```

The workflow:
1. Calculates the next version based on git history
2. Creates and pushes a new git tag (e.g., `v1.0.2`)
3. Builds the app with that version
4. Deploys to GitHub Pages

### Manual Minor/Major Bumps

To bump minor or major versions, include keywords in your commit message:

#### Minor Version Bump (1.0.x → 1.1.0)

Include `(MINOR)` in your commit message:

```bash
git commit -m "feat: add new race timing feature (MINOR)"
git push origin main
```

Result: `1.0.5` → `1.1.0`

#### Major Version Bump (1.x.x → 2.0.0)

Include `(MAJOR)` in your commit message:

```bash
git commit -m "feat: complete redesign of UI (MAJOR)"
git push origin main
```

Result: `1.5.3` → `2.0.0`

## Version Display

The version is displayed in:
- **Settings Page**: Bottom of the page shows "Bushrun Race Day PWA v1.0.2"
- **Build Logs**: GitHub Actions shows version being built
- **Git Tags**: All versions are tagged in git history

## Checking Current Version

### In the App
1. Go to Settings page
2. Scroll to bottom
3. See: "Bushrun Race Day PWA vX.Y.Z"

### In GitHub
- Check: https://github.com/ahmad2x4/bushrun-race-day/tags
- Or run: `git tag -l`

### In Build Logs
- Go to: https://github.com/ahmad2x4/bushrun-race-day/actions
- Click on any workflow run
- See: "📦 Building version: vX.Y.Z"

## Examples

### Normal Development (Auto Patch Bump)
```bash
git commit -m "fix: correct handicap calculation"
git push origin main
# Version: 1.0.1 → 1.0.2
```

### New Feature (Minor Bump)
```bash
git commit -m "feat: add CSV export for results (MINOR)"
git push origin main
# Version: 1.0.5 → 1.1.0
```

### Breaking Changes (Major Bump)
```bash
git commit -m "refactor: new database schema (MAJOR)

This changes the IndexedDB structure and requires migration.
Breaking change for users with existing data."
git push origin main
# Version: 1.3.2 → 2.0.0
```

### Multiple Commits
If you push multiple commits at once, only the highest bump applies:
- Commits: fix, feat(MINOR), fix → Result: Minor bump
- Commits: feat(MINOR), fix(MAJOR), feat → Result: Major bump

## Manual Tagging (Alternative)

You can also manually create tags without keywords:

```bash
# For minor bump
git tag v1.2.0
git push origin v1.2.0

# For major bump
git tag v2.0.0
git push origin v2.0.0
```

Then push to main to deploy that version.

## Version Format

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, complete rewrites
- **MINOR**: New features, backwards-compatible
- **PATCH**: Bug fixes, small improvements

**Tag Format:** `vX.Y.Z` (e.g., `v1.0.2`, `v2.1.0`)

## Troubleshooting

### Version Not Incrementing

**Problem**: Version stays the same after push

**Solution**:
- Check GitHub Actions logs for errors
- Ensure `contents: write` permission is set
- Check that git history is fetched (`fetch-depth: 0`)

### Wrong Version Displayed

**Problem**: App shows old version

**Solution**:
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check build logs to confirm version was injected
- Wait for GitHub Pages deployment to complete (~2 min)

### Can't Push Tags

**Problem**: Tag creation fails in workflow

**Solution**:
- Check repository Settings → Actions → General
- Ensure "Workflow permissions" is set to "Read and write permissions"
- Or set `contents: write` in workflow permissions

## Configuration

The versioning is configured in `.github/workflows/static.yml`:

```yaml
- name: Calculate semantic version
  uses: paulhatch/semantic-version@v5.4.0
  with:
    tag_prefix: "v"
    major_pattern: "(MAJOR)"    # Commit must contain (MAJOR)
    minor_pattern: "(MINOR)"    # Commit must contain (MINOR)
    bump_each_commit: true      # Auto-increment patch by default
```

## Best Practices

1. **Let it auto-bump** for most commits (bug fixes, small changes)
2. **Use (MINOR)** when adding new features
3. **Use (MAJOR)** only for breaking changes
4. **Check the version** in Settings after deployment
5. **Tag important releases** for easy rollback reference

## Quick Reference

| Change Type | Commit Message | Version Change |
|-------------|----------------|----------------|
| Bug fix | `fix: correct timer` | 1.0.1 → 1.0.2 |
| Small improvement | `chore: update styles` | 1.0.2 → 1.0.3 |
| New feature | `feat: add feature (MINOR)` | 1.0.3 → 1.1.0 |
| Breaking change | `refactor: rewrite (MAJOR)` | 1.1.0 → 2.0.0 |

---

**Current Version:** Check Settings page or https://github.com/ahmad2x4/bushrun-race-day/tags
