# @vercel/node TypeScript Project References Bug Reproduction

This repository demonstrates a bug in `@vercel/node` that breaks TypeScript project references (`composite: true`) in monorepo setups.

## The Issue

When deploying Elysia (or any non-Next.js framework) to Vercel in a monorepo with TypeScript project references:

1. ✅ Your build command (`tsc -b`) completes successfully
2. ❌ `@vercel/node` performs a **secondary TypeScript compilation** that fails
3. ❌ Types from workspace packages resolve as `unknown` or `{}`

### Root Cause

In [`packages/node/src/typescript.ts`](https://github.com/vercel/vercel/blob/main/packages/node/src/typescript.ts), the `fixConfig()` function explicitly deletes these compiler options:

```typescript
// From @vercel/node source
function fixConfig(config: ts.ParsedCommandLine) {
  delete config.options.composite;
  delete config.options.declarationDir;
  delete config.options.declarationMap;
  delete config.options.emitDeclarationOnly;
  delete config.options.tsBuildInfoFile;
  delete config.options.incremental;
  // ...
}
```

This breaks TypeScript project references, which **require** `composite: true` to function properly.

Additionally, `readConfig()` wipes out file configuration, further breaking monorepo setups.

### Error Example

```
Error: apps/api/src/index.ts - error TS2769: No overload matches this call.
  Argument of type 'unknown' is not assignable to parameter of type 'User'.

Error: apps/api/src/index.ts - error TS2345: Argument of type 'unknown' 
  is not assignable to parameter of type 'ApiResponse<User>'.
```

The "Using TypeScript X.X.X" message appears in logs **after** your build command completes, indicating the secondary compilation.

## Project Structure

```
elysia-turborepo-vercel/
├── apps/
│   └── api/                    # Elysia API app
│       ├── src/
│       │   └── index.ts        # Main Elysia app (uses shared types)
│       ├── package.json
│       ├── tsconfig.json       # References packages/shared, composite: true
│       └── vercel.json
├── packages/
│   └── shared/                 # Shared types & utilities
│       ├── src/
│       │   └── index.ts        # Exports User, Post, ApiResponse, etc.
│       ├── package.json
│       └── tsconfig.json       # composite: true
├── package.json                # Workspace root
├── tsconfig.json               # Root project references
└── turbo.json
```

## Reproduction Steps

### 1. Install dependencies

```bash
bun install
```

> **Note:** If you encounter stale cache issues, run `bunx turbo run clean` or delete `.turbo` directories.

### 2. Build locally (this works!)

```bash
bunx turbo run build --force
```

The build succeeds because `tsc -b` correctly uses project references + `paths` mapping.

### 3. Deploy to Vercel (this fails!)

```bash
# Using Vercel CLI
vercel

# Or push to GitHub with Vercel integration
```

### Expected Behavior

Vercel should respect the `composite` option and properly resolve types from workspace packages.

### Actual Behavior

Build fails with type errors because `@vercel/node`'s secondary compilation strips `composite`, breaking project reference type resolution.

## Affected Frameworks

This affects **all non-Next.js frameworks** using `@vercel/node` in monorepos:

- Elysia
- Hono
- Express
- Fastify
- Koa
- etc.

Next.js doesn't have this issue because it uses its own TypeScript handling.

## Workarounds

### 1. Disable TypeScript compilation in @vercel/node

Add to `vercel.json`:

```json
{
  "functions": {
    "api/**/*.ts": {
      "excludeFiles": "**/*.ts"
    }
  }
}
```

This prevents the secondary compilation but may cause other issues.

### 2. Pre-bundle everything

Bundle all dependencies into a single file before deployment, eliminating the need for project references at runtime.

### 3. Use @vercel/static-build instead

Deploy as a static build with custom server handling.

## Proposed Fix

The `fixConfig()` function in `@vercel/node` should:

1. **Not delete `composite`** when project references are detected
2. **Preserve `declarationMap`** for accurate source mapping
3. **Respect the user's tsconfig** instead of overwriting it

Alternatively, `@vercel/node` could detect when a build command has already run and skip the secondary TypeScript compilation entirely.

## Related Issues

- [vercel/vercel#XXXXX](https://github.com/vercel/vercel/issues) - TypeScript project references broken
- [vercel/vercel#XXXXX](https://github.com/vercel/vercel/issues) - composite tsconfig stripped

## Environment

- TypeScript: ^5.9.3
- Elysia: latest
- Bun: 1.2.2
- @vercel/node: 3.x
- Turborepo: latest

