# Semantic Release Setup

This package uses [semantic-release](https://semantic-release.gitbook.io/) to automate versioning and releases based on [Conventional Commits](https://www.conventionalcommits.org/).

## How It Works

Semantic-release analyzes commit messages and automatically:
- Determines the next version number
- Generates release notes
- Updates the CHANGELOG.md
- Updates package.json version
- Creates a GitHub release
- Tags the release

## Commit Message Format

Use conventional commit messages:

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `feat!:` or `fix!:` - Breaking change (triggers major version bump)
- `docs:` - Documentation changes (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `perf:` - Performance improvements (triggers patch version bump)
- `test:` - Test changes (no version bump)
- `chore:` - Build/tooling changes (no version bump)

### Examples

```bash
feat: add responsive breakpoint support
fix: correct column calculation for edge cases
feat!: change API to use new prop structure
perf: optimize row calculation algorithm
```

## Current Configuration

- **npmPublish**: `false` (disabled until ready to publish)
- **Branches**: `main` (releases), `beta` (prereleases)
- **Changelog**: Auto-generated in `CHANGELOG.md`
- **GitHub Releases**: Automatically created

## When Moving to Separate Repo

1. Update package name in `package.json` (currently `@workspace/layouts`)
2. Update repository URL in `package.json`
3. Set `npmPublish: true` in `.releaserc.json`
4. Add `NPM_TOKEN` secret to GitHub repository
5. Update workflow file paths if needed

## Manual Release

To trigger a release manually:

```bash
# Make changes and commit with conventional commit message
git commit -m "feat: add new feature"

# Push to main branch
git push origin main

# GitHub Actions will automatically run semantic-release
```

## Testing Locally

```bash
# Dry run (won't create releases)
pnpm run semantic-release --dry-run

# Full release (requires GITHUB_TOKEN)
GITHUB_TOKEN=your_token pnpm run semantic-release
```

