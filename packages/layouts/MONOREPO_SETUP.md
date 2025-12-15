# Monorepo Setup Guide for UI Components

This guide walks you through setting up a new monorepo repository for publishing multiple npm packages, starting with `layout-grid`.

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Initial Setup](#initial-setup)
3. [Moving layout-grid Package](#moving-layout-grid-package)
4. [Monorepo Configuration](#monorepo-configuration)
5. [Semantic Release Setup](#semantic-release-setup)
6. [CI/CD Configuration](#cicd-configuration)
7. [Adding New Packages](#adding-new-packages)
8. [Publishing Workflow](#publishing-workflow)

---

## Repository Structure

```
your-ui-components-repo/
├── .github/
│   └── workflows/
│       └── release.yml              # Single release workflow
├── packages/
│   ├── layout-grid/                 # Layout components package
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── .releaserc.json
│   │   ├── README.md
│   │   └── CHANGELOG.md
│   ├── typescript-config/          # Shared TypeScript configs
│   │   ├── base.json
│   │   ├── react-library.json
│   │   └── package.json
│   └── [future-package]/           # Future packages go here
├── .gitignore
├── .npmrc                          # pnpm configuration
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                    # Root package.json
└── README.md
```

---

## Initial Setup

### Step 1: Create New Repository

```bash
# Create new directory
mkdir your-ui-components-repo
cd your-ui-components-repo

# Initialize git
git init
git branch -M main
```

### Step 2: Create Root package.json

Create `package.json` at the root:

```json
{
  "name": "your-ui-components-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "Monorepo for reusable UI component packages",
  "packageManager": "pnpm@10.24.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "turbo build",
    "lint": "turbo lint",
    "format": "turbo format",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "@biomejs/biome": "2.3.8",
    "turbo": "^2.6.1",
    "typescript": "5.9.2",
    "ultracite": "5.6.2"
  }
}
```

### Step 3: Create pnpm-workspace.yaml

```yaml
packages:
  - packages/*

catalog:
  # React ecosystem
  react: ^19.1.1
  react-dom: ^19.1.1
  '@types/react': ^19.1.10
  '@types/react-dom': ^19.1.7
  
  # TypeScript
  typescript: 5.9.2
  '@types/node': ^20.19.9
  
  # Build tools
  tsup: ^8.0.0
  
  # Semantic release
  semantic-release: ^24.0.0
  '@semantic-release/changelog': ^6.0.3
  '@semantic-release/git': ^10.0.1
  '@semantic-release/github': ^9.2.6
  '@semantic-release/npm': ^12.0.1
```

### Step 4: Create turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"],
      "cache": false
    },
    "format": {},
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Step 5: Create .gitignore

```
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
.turbo
```

### Step 6: Create .npmrc

```
shamefully-hoist=true
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=*ultracite*
```

---

## Moving layout-grid Package

### Step 1: Copy Package Files

Copy the entire `packages/layouts` directory from your current repo to the new repo as `packages/layout-grid`:

```bash
# From your current repo
cp -r packages/layouts /path/to/new-repo/packages/layout-grid
```

### Step 2: Update Package Name

Update `packages/layout-grid/package.json`:

```json
{
  "name": "@your-org/layout-grid",  // Change this
  "version": "0.1.0",
  // ... rest of config
}
```

**Important**: Update the package name to your npm organization scope (e.g., `@your-org/layout-grid`).

### Step 3: Update Repository URL

Update `packages/layout-grid/package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/your-ui-components-repo.git",
    "directory": "packages/layout-grid"
  }
}
```

### Step 4: Create Shared TypeScript Config Package

Create `packages/typescript-config/package.json`:

```json
{
  "name": "@your-org/typescript-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "files": [
    "base.json",
    "react-library.json"
  ]
}
```

Create `packages/typescript-config/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleDetection": "force",
    "moduleResolution": "NodeNext",
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022"
  }
}
```

Create `packages/typescript-config/react-library.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### Step 5: Update layout-grid TypeScript Config

Update `packages/layout-grid/tsconfig.json`:

```json
{
  "extends": "@your-org/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 6: Update layout-grid package.json Dependencies

Update `packages/layout-grid/package.json` devDependencies:

```json
{
  "devDependencies": {
    "@semantic-release/changelog": "catalog:",
    "@semantic-release/git": "catalog:",
    "@semantic-release/github": "catalog:",
    "@semantic-release/npm": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@your-org/typescript-config": "workspace:*",
    "semantic-release": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  }
}
```

---

## Semantic Release Setup

### Step 1: Update .releaserc.json for Monorepo

Update `packages/layout-grid/.releaserc.json`:

```json
{
  "branches": [
    "main",
    {
      "name": "beta",
      "prerelease": true
    }
  ],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          {
            "type": "feat",
            "scope": "layout-grid",
            "release": "minor"
          },
          {
            "type": "fix",
            "scope": "layout-grid",
            "release": "patch"
          },
          {
            "type": "feat",
            "scope": "layout-grid",
            "breaking": true,
            "release": "major"
          }
        ]
      }
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true,
        "pkgRoot": "."
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": [
          "package.json",
          "CHANGELOG.md"
        ],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

**Note**: Set `npmPublish: true` when ready to publish to npm.

### Step 2: Commit Message Format

Use scoped commit messages for monorepo:

```bash
feat(layout-grid): add responsive breakpoint support
fix(layout-grid): correct column calculation
feat(layout-grid)!: change API structure
```

The scope (`layout-grid`) helps semantic-release identify which package to release.

---

## CI/CD Configuration

### Step 1: Create Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release Packages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NODE_OPTIONS: "--max_old_space_size=4096"
      PNPM_VERSION: 10.24.0

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          run_install: false

      - name: Setup Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile --ignore-scripts --prefer-offline

      - name: Build all packages
        run: pnpm run build

      - name: Release layout-grid
        working-directory: ./packages/layout-grid
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm run semantic-release
        continue-on-error: true

      # Add more release steps for future packages here
      # - name: Release [package-name]
      #   working-directory: ./packages/[package-name]
      #   env:
      #     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      #     NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      #   run: pnpm run semantic-release
      #   continue-on-error: true
```

### Step 2: Set Up GitHub Secrets

In your GitHub repository settings, add:

- `NPM_TOKEN`: Your npm access token (create at npmjs.com)
  - Required scopes: `read-write` for publishing

The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

### Step 3: Optional - Path-Based Triggering

To only run releases when specific packages change, update the workflow:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - "packages/layout-grid/**"
      - ".github/workflows/release.yml"
```

---

## Adding New Packages

### Step 1: Create Package Directory

```bash
mkdir -p packages/new-package/src
cd packages/new-package
```

### Step 2: Initialize package.json

```json
{
  "name": "@your-org/new-package",
  "version": "0.1.0",
  "description": "Description of your package",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md"
  ],
  "scripts": {
    "build": "tsup",
    "lint": "npx ultracite lint",
    "format": "npx ultracite fix",
    "typecheck": "tsc --noEmit",
    "semantic-release": "semantic-release"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@semantic-release/changelog": "catalog:",
    "@semantic-release/git": "catalog:",
    "@semantic-release/github": "catalog:",
    "@semantic-release/npm": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@your-org/typescript-config": "workspace:*",
    "semantic-release": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/your-ui-components-repo.git",
    "directory": "packages/new-package"
  },
  "license": "MIT"
}
```

### Step 3: Create TypeScript Config

Create `packages/new-package/tsconfig.json`:

```json
{
  "extends": "@your-org/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Create Build Config

Create `packages/new-package/tsup.config.ts`:

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".mjs",
    };
  },
});
```

### Step 5: Create Semantic Release Config

Create `packages/new-package/.releaserc.json` (copy from layout-grid and update scope):

```json
{
  "branches": ["main", { "name": "beta", "prerelease": true }],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "scope": "new-package", "release": "minor" },
          { "type": "fix", "scope": "new-package", "release": "patch" },
          { "type": "feat", "scope": "new-package", "breaking": true, "release": "major" }
        ]
      }
    ],
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/npm", { "npmPublish": true, "pkgRoot": "." }],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

### Step 6: Add to Release Workflow

Add a new release step in `.github/workflows/release.yml`:

```yaml
- name: Release new-package
  working-directory: ./packages/new-package
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: pnpm run semantic-release
  continue-on-error: true
```

### Step 7: Create Source Files

Create `packages/new-package/src/index.ts`:

```typescript
// Export your components and types here
export { default as MyComponent } from "./components/MyComponent.js";
export type { MyComponentProps } from "./components/MyComponent.js";
```

---

## Publishing Workflow

### Step 1: Make Changes

Make your code changes and commit with conventional commit messages:

```bash
git add .
git commit -m "feat(layout-grid): add new feature"
```

### Step 2: Push to Main

```bash
git push origin main
```

### Step 3: Automatic Release

GitHub Actions will:
1. Build all packages
2. Run semantic-release for each package that has changes
3. Update version numbers
4. Generate CHANGELOG.md
5. Create GitHub releases
6. Publish to npm (if `npmPublish: true`)

### Step 4: Verify Release

Check:
- GitHub Releases page for new release
- npm registry for updated package
- CHANGELOG.md for release notes

---

## Best Practices

### 1. Package Naming

Use consistent naming:
- `@your-org/package-name` (kebab-case)
- Keep names descriptive and specific

### 2. Version Management

- Each package has independent versioning
- Use semantic versioning (semver)
- Breaking changes trigger major version bumps

### 3. Commit Messages

Always use scoped commits:
```bash
✅ feat(layout-grid): add feature
✅ fix(layout-grid): fix bug
❌ feat: add feature (missing scope)
```

### 4. Testing

Before publishing:
```bash
# Build all packages
pnpm run build

# Type check
pnpm run typecheck

# Lint
pnpm run lint
```

### 5. Local Development

Test packages locally:
```bash
# In the package directory
pnpm run build

# In consuming app, use workspace protocol
pnpm add @your-org/layout-grid@workspace:*
```

---

## Troubleshooting

### Issue: Semantic-release doesn't detect changes

**Solution**: Ensure commit messages use the correct scope:
```bash
feat(layout-grid): your message
```

### Issue: Build fails in CI

**Solution**: Check that all dependencies are properly configured in `pnpm-workspace.yaml` catalog.

### Issue: npm publish fails

**Solution**: 
- Verify `NPM_TOKEN` secret is set
- Check package name is available on npm
- Ensure `npmPublish: true` in `.releaserc.json`

### Issue: TypeScript errors with imports

**Solution**: Ensure all relative imports use `.js` extension:
```typescript
import { something } from "./utils/helper.js";
```

---

## Next Steps

1. ✅ Set up repository structure
2. ✅ Move layout-grid package
3. ✅ Configure semantic-release
4. ✅ Set up CI/CD
5. 🔄 Test release workflow
6. 🔄 Add more packages as needed

---

## Resources

- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turbo Repo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

