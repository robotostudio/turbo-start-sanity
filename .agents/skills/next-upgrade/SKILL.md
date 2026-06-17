---
name: next-upgrade
description: Upgrade Next.js to the latest version following official migration guides and codemods
argument-hint: "[target-version]"
---

# Upgrade Next.js

Upgrade the current project to the requested Next.js version following official migration guides.

## Instructions

1. **Detect current version**: Read `package.json` to identify the current Next.js version and related dependencies (React, React DOM, etc.)

2. **Fetch the latest upgrade guide**: Fetch the official upgrade documentation from these URLs:
   - Codemods: https://nextjs.org/docs/app/guides/upgrading/codemods
   - Version-specific guides (adjust version as needed):
     - https://nextjs.org/docs/app/guides/upgrading/version-16
     - https://nextjs.org/docs/app/guides/upgrading/version-15
     - https://nextjs.org/docs/app/guides/upgrading/version-14

3. **Determine upgrade path**: Based on current version, identify which migration steps apply. For major version jumps, upgrade incrementally (e.g., 13 → 14 → 15).

4. **Run codemods first**: Next.js provides codemods to automate breaking changes:

   ```bash
   npx @next/codemod@latest <transform> <path>
   ```

   Common transforms:
   - `next-async-request-api` - Updates async Request APIs (v15)
   - `next-request-geo-ip` - Migrates geo/ip properties (v15)
   - `next-dynamic-access-named-export` - Transforms dynamic imports (v15)

5. **Update dependencies**: Upgrade Next.js and peer dependencies together, using the exact `[target-version]` passed by the user for the current step. If no target version was provided, use the next incremental version identified in Step 3 instead of jumping straight to `latest`. Determine `<supported-react-version>` from the official upgrade guide for that target Next.js version, since React and React DOM peer requirements can change between releases:

   ```bash
   npm install next@<target-version> react@<supported-react-version> react-dom@<supported-react-version>
   ```

6. **Review breaking changes**: Check the upgrade guide for manual changes needed:
   - API changes (e.g., async params in v15)
   - Configuration changes in `next.config.js`
   - Deprecated features being removed

7. **Update TypeScript types** (if applicable):

   ```bash
   npm install @types/react@latest @types/react-dom@latest
   ```

8. **Test the upgrade**:
   - Run `npm run build` to check for build errors
   - Run `npm run dev` and test key functionality
