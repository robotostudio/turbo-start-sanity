# Monorepo Setup Checklist

Use this checklist to track your progress setting up the new monorepo.

## Phase 1: Repository Initialization

- [ ] Create new repository on GitHub
- [ ] Clone repository locally
- [ ] Create root `package.json`
- [ ] Create `pnpm-workspace.yaml`
- [ ] Create `turbo.json`
- [ ] Create `.gitignore`
- [ ] Create `.npmrc`
- [ ] Run `pnpm install` to verify setup

## Phase 2: Shared Configuration

- [ ] Create `packages/typescript-config/` directory
- [ ] Create `packages/typescript-config/package.json`
- [ ] Create `packages/typescript-config/base.json`
- [ ] Create `packages/typescript-config/react-library.json`
- [ ] Verify TypeScript config package builds

## Phase 3: Move layout-grid Package

- [ ] Copy `packages/layouts` → `packages/layout-grid` in new repo
- [ ] Update package name in `package.json` to `@your-org/layout-grid`
- [ ] Update repository URL in `package.json`
- [ ] Update TypeScript config to use shared config
- [ ] Update devDependencies to use catalog/workspace references
- [ ] Verify package builds: `pnpm --filter layout-grid build`
- [ ] Verify TypeScript: `pnpm --filter layout-grid typecheck`

## Phase 4: Semantic Release Configuration

- [ ] Update `.releaserc.json` with correct scope (`layout-grid`)
- [ ] Set `npmPublish: false` initially (change to `true` when ready)
- [ ] Create initial `CHANGELOG.md`
- [ ] Test semantic-release locally: `pnpm --filter layout-grid semantic-release --dry-run`

## Phase 5: CI/CD Setup

- [ ] Create `.github/workflows/release.yml`
- [ ] Add `NPM_TOKEN` secret to GitHub repository
- [ ] Verify workflow syntax
- [ ] Test workflow with a test commit
- [ ] Verify GitHub Actions runs successfully

## Phase 6: First Release (Dry Run)

- [ ] Make a test change
- [ ] Commit with conventional commit: `feat(layout-grid): test release`
- [ ] Push to main branch
- [ ] Verify semantic-release runs in CI
- [ ] Check that version updates (but doesn't publish yet)

## Phase 7: Enable Publishing

- [ ] Verify npm package name is available
- [ ] Create npm account/organization if needed
- [ ] Generate npm access token
- [ ] Add `NPM_TOKEN` secret to GitHub
- [ ] Set `npmPublish: true` in `.releaserc.json`
- [ ] Make a real change and commit
- [ ] Push and verify package publishes to npm

## Phase 8: Documentation

- [ ] Update root `README.md` with monorepo overview
- [ ] Ensure each package has its own `README.md`
- [ ] Document how to add new packages
- [ ] Add contributing guidelines

## Phase 9: Future Packages

- [ ] Create template/starter for new packages
- [ ] Document package creation process
- [ ] Set up automated testing (if needed)
- [ ] Consider adding Storybook or similar for component docs

---

## Quick Commands Reference

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm --filter layout-grid build

# Lint all packages
pnpm run lint

# Type check all packages
pnpm run typecheck

# Test semantic-release (dry run)
pnpm --filter layout-grid semantic-release --dry-run

# Clean all builds
pnpm run clean
```

---

## Common Issues & Solutions

### Issue: pnpm install fails
**Check**: Verify `pnpm-workspace.yaml` syntax and catalog entries

### Issue: TypeScript errors
**Check**: Ensure shared TypeScript config is properly referenced

### Issue: Build fails
**Check**: Verify all dependencies are in catalog or properly declared

### Issue: Semantic-release doesn't trigger
**Check**: 
- Commit message has correct scope: `feat(layout-grid): ...`
- Workflow file is in `.github/workflows/`
- GitHub Actions has proper permissions

---

## Notes

- Keep `npmPublish: false` until you're ready to publish
- Test everything locally before pushing
- Use conventional commits with scopes
- Each package is independently versioned

