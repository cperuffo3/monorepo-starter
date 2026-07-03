# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Start everything (Docker + migrations + dev servers)
pnpm dev:full

# Start development servers only (assumes Docker is running)
pnpm dev

# Build all apps
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Docker & Database

```bash
pnpm docker:up       # Start PostgreSQL container
pnpm docker:down     # Stop containers
pnpm db:generate     # Generate Prisma client
pnpm db:migrate      # Run Prisma migrations
pnpm db:studio       # Open Prisma Studio (http://localhost:5555)
```

### Per-App Commands

```bash
# API (NestJS) - from apps/api
pnpm --filter @starter/api dev
pnpm --filter @starter/api build
pnpm --filter @starter/api type-check

# Web (Vite/React) - from apps/web
pnpm --filter @starter/web dev
pnpm --filter @starter/web build
```

### Adding shadcn/ui Components

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

### Scaffolding New Code

```bash
pnpm gen feature [name]   # New web feature slice (apps/web/src/features/[name])
pnpm gen module [name]    # New API domain module (apps/api/src/core/[name])
```

## Architecture

This is a **pnpm workspaces + Turborepo** monorepo. The organization is a contract, documented in `.documentation/devdocs/organization.md` and **enforced by ESLint** (`eslint-plugin-boundaries` layer rules, `eslint-plugin-check-file` kebab-case naming, `no-restricted-imports` fences). Read that doc before adding folders or moving code.

### apps/api (NestJS Backend)

- **Package name**: `@starter/api`
- **Entry**: `src/main.ts` - global prefix `/api/v1`, CORS, global `ValidationPipe`, Swagger at `/api/openapi`
- **Layer taxonomy** (lint-enforced):
  - `src/core/` — domain modules (e.g. `user/`), each with `*.controller.ts`, `*.service.ts`, `dto/`, `index.ts`; aggregated in `core/core.module.ts`
  - `src/integrations/` — infrastructure modules (e.g. `health/`)
  - `src/common/` — cross-cutting plumbing (logging, filters, interceptors)
  - `src/database/` — persistence: `PrismaService`, repos (`repos/<entity>/<entity>.repo.ts`), entity type re-exports. **Only this layer may import `prisma/generated`**; services use repos, never Prisma directly.
- **Database**: Prisma with PostgreSQL adapter (`@prisma/adapter-pg`); schema in `prisma/schema.prisma`, generated client in `prisma/generated/prisma/`
- Uses ES modules (`"type": "module"`); relative imports need `.js` extensions

### apps/web (Vite + React Frontend)

- **Package name**: `@starter/web`
- **Tech**: React 19, TypeScript, Tailwind CSS v4, TanStack Query
- **Feature slices** in `src/features/<name>/`, internally layered (lint-enforced): `services/` (HTTP via `@/lib/api-client` — nothing else calls fetch) → `queries/` (TanStack Query hooks) → `components/` + `pages/`. Features may not import other features' internals.
- **Shared layers**: `components/ui/` (shadcn, vendored), `components/common/`, `hooks/`, `lib/`, `config/`, `providers/`
- **Path alias**: `@` = `src/` (the only alias)
- **API proxy**: Vite dev server proxies `/api` to `localhost:3000`
- **Naming**: kebab-case files/folders everywhere (`health-status-card.tsx`, `use-theme.ts`)

### packages/shared (@starter/shared)

API wire-contract types (request/response shapes) used by both apps. Dates are ISO strings. Builds to `dist/` via tsc (`prepare` on install; turbo orders `^build`).

### Workspace Structure

```
apps/
├── api/           # NestJS backend (@starter/api)
│   ├── src/       # core/ + integrations/ + common/ + database/
│   └── prisma/    # Schema + generated client
└── web/           # Vite + React frontend (@starter/web)
    └── src/
        ├── features/   # Feature slices (services → queries → components/pages)
        └── components/ # ui/ (shadcn) + common/
packages/
└── shared/        # @starter/shared — API contract types
docker/            # docker-compose.yml for PostgreSQL
```

## Key Conventions

- **Imports in API**: Use `.js` extension for relative imports (ESM requirement)
- **Prisma access**: only via repos in `src/database/repos/`; entity types via the `database` barrel
- **Barrels**: every folder has an `index.ts`; cross-module imports go through them (lint-enforced)
- **Shared API types**: `import type { UserResponse } from '@starter/shared'`
- **Environment files**: `.env` at root and `apps/api/.env` (see `.env.example`)
- **Database URL**: Set via `DATABASE_URL` in `apps/api/.env`

## Running Services

| Service    | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:5173        |
| API        | http://localhost:3000/api/v1 |
| PostgreSQL | localhost:5432               |

## Project Initialization

This is a starter template. To customize it for your project:

```bash
pnpm init-project
```

The script will prompt you to:

- Set your project name (e.g., `my-awesome-app`)
- Choose package naming convention (`@myapp/api` vs `myapp-api` vs `api`)
- Set initial version (0.1.0 or 1.0.0)
- Optionally reset git history

This updates all package names, Docker configs, environment files, and documentation.

## Version Management (release-it)

This project uses [release-it](https://github.com/release-it/release-it) for version management with conventional commits.

### Creating a Release

```bash
pnpm release           # Create a new release (interactive)
pnpm release:dry       # Preview release without making changes
```

Release-it will:

1. Bump version in all workspace packages
2. Generate/update CHANGELOG.md from conventional commits
3. Create a git tag
4. Create a GitHub release

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) for automatic changelog generation:

- `feat: add new feature` - Features (minor version bump)
- `fix: resolve bug` - Bug Fixes (patch version bump)
- `perf: improve performance` - Performance improvements
- `refactor: restructure code` - Refactoring
- `docs: update readme` - Documentation
- `chore: update deps` - Maintenance (hidden from changelog)

Breaking changes: Add `BREAKING CHANGE:` in the commit body or `!` after the type (e.g., `feat!: breaking change`).
