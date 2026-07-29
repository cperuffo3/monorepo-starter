# Code Organization Guide

This document is the **contract** for how code in this monorepo is organized. It is not advisory: the taxonomy below is mechanically enforced by ESLint (`eslint-plugin-boundaries`, `eslint-plugin-check-file`, `no-restricted-imports`) in both apps, and the `pnpm gen` scaffolder generates code in this shape.

The architecture follows four organizational principles:

1. The **server is split by architectural role** — domain (`core/`), infrastructure (`integrations/`), plumbing (`common/`), persistence (`database/`).
2. The **client is split by feature**, and each feature is internally **layered**: `services/` (HTTP) → `queries/` (TanStack Query) → `components/`/`hooks/` (UI).
3. **Persistence is centralized**: services never touch the Prisma client directly — they go through repositories in `database/repos/`.
4. **Shared API contracts** live in `packages/shared` and are imported by both apps.

---

## Workspace layout

```
apps/
├── api/          # NestJS backend (@starter/api)
└── web/          # Vite + React frontend (@starter/web)
packages/
└── shared/       # @starter/shared — API contract types (wire format) used by both apps
```

---

## Backend (API) — NestJS

### Layer taxonomy

```
apps/api/src/
├── common/            # Cross-cutting plumbing (no business logic, no DB access)
│   └── logging/       #   logger service, logging interceptor, exception filter
├── core/              # Domain modules — the business logic
│   ├── core.module.ts #   aggregates all domain modules
│   └── user/          #   example domain module (see anatomy below)
├── database/          # Persistence layer — the ONLY code that touches Prisma
│   ├── database.module.ts  # @Global(); provides PrismaService + all repos
│   ├── prisma.service.ts
│   ├── repos/         #   one folder per entity: repos/user/user.repo.ts
│   └── types.ts       #   re-exports generated Prisma entity types
├── integrations/      # Infrastructure modules (health, mail, queue, storage, ...)
│   └── health/
├── app.module.ts
└── main.ts            # global prefix, CORS, ValidationPipe, Swagger
```

**Which layer does my code go in?**

| Layer           | Contains                                                            | May import                                    |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `common/`       | Interceptors, filters, guards, decorators, pipes, logger, helpers   | `common` only                                 |
| `database/`     | PrismaService, repositories, entity type re-exports                 | `database`, `common`                          |
| `core/`         | Domain modules: controllers, services, DTOs                         | `core`, `common`, `database`, `integrations`  |
| `integrations/` | Infrastructure with external systems (health, mail, queue, storage) | `common`, `database`, same integration module |

These edges are enforced by `boundaries/dependencies` in `eslint.config.mjs`. Cross-layer imports must go through the layer's barrel (`index.ts`) — enforced by trailing barrel policies in the same rule (policies are last-match-wins).

### Domain module anatomy (`core/<name>/`)

```
core/user/
├── dto/                    # class-validator DTOs, one action-named class per file
│   ├── create-user.dto.ts
│   └── index.ts
├── user.controller.ts      # HTTP endpoints + Swagger decorators
├── user.service.ts         # Business logic; uses repos from src/database
├── user.module.ts
└── index.ts                # Barrel — the module's public API
```

- Larger modules may add `services/`, `guards/`, `strategies/`, `utils/` subfolders.
- Register new modules in `core/core.module.ts` (done automatically by `pnpm gen module <name>`).
- DTOs are validated globally by the `ValidationPipe` configured in `main.ts` (`whitelist` + `transform`).
- Response shapes returned by services are the **wire-format types from `@starter/shared`** (dates as ISO strings), not Prisma entities.

### Persistence rules

- **Only `src/database/` may import `prisma/generated/`** — lint error anywhere else.
- Entity types are re-exported from `database/types.ts` (available via the `database` barrel).
- One repo folder per entity: `database/repos/<entity>/<entity>.repo.ts`, registered in `database.module.ts` (which is `@Global()`, so repos are injectable everywhere without imports).
- Services contain business logic; repos contain query logic. A service never calls `prisma.*` directly.

### Naming (lint-enforced: kebab-case files, kebab-case folders)

Role suffixes, matching NestJS convention: `.module.ts`, `.controller.ts`, `.service.ts`, `.repo.ts`, `.dto.ts`, `.guard.ts`, `.decorator.ts`, `.interceptor.ts`, `.filter.ts`, `.types.ts`, `.constants.ts`, `.util.ts`. Tests are co-located `*.spec.ts`.

### Other conventions

- ESM: use `.js` extensions on relative imports.
- Deep relative imports (`../../../`) are banned — import from a layer barrel instead.
- Every folder exposes a barrel `index.ts`; it defines the folder's public API.

---

## Frontend (Web) — React + Vite

### Layer taxonomy

```
apps/web/src/
├── components/
│   ├── ui/           # Generic primitives (shadcn/ui, vendored) — no app knowledge
│   ├── common/       # App-specific reusables (error-page, ...)
│   └── layout/       # App shell components (headers, sidebars) — add as needed
├── features/         # Feature slices — the unit of organization (see anatomy below)
├── hooks/            # Cross-feature hooks (use-theme, use-mobile)
├── lib/              # Foundations: api-client, api-error, utils, error-reporting
├── config/           # env.ts — typed environment access
├── providers/        # App-level providers (error boundary, ...)
├── styles/           # tokens.css, primitives.css
├── main.tsx          # Entry: providers, QueryClient, routes
└── index.css
```

**Import rules (lint-enforced):**

| From                 | May import                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| `components/ui`      | `ui`, `lib`, `hooks`                                                         |
| `components/*` other | `ui`, `components`, `lib`, `hooks`, `config`                                 |
| `features/<x>`       | shared layers + **its own feature only** — never another feature's internals |
| `hooks`, `lib`       | `lib`, `config`, `hooks` — never components or features                      |
| `main.tsx`           | anything                                                                     |

Cross-feature imports are only possible through a feature's barrel (`features/<x>/index.ts`) — and should be rare; if two features need the same code, move it to a shared layer.

### Feature anatomy (`features/<name>/`)

The layered data flow is **services → queries → components**:

```
features/dashboard/
├── services/               # Raw HTTP calls via @/lib/api-client — nothing else calls fetch
│   ├── health-service.ts   #   getHealth(): Promise<HealthStatus>
│   └── index.ts
├── queries/                # TanStack Query hooks wrapping services
│   ├── health-query.ts     #   useHealth()
│   └── index.ts
├── components/             # Feature-specific components
│   ├── health-status-card.tsx
│   └── index.ts
├── pages/                  # Route components (thin; compose feature pieces)
│   ├── dashboard-page.tsx
│   └── index.ts
└── index.ts                # Feature barrel — the slice's public API
```

Optional subfolders as a feature grows: `hooks/`, `types/` (feature-local types), `utils/`, `stores/` (client state), `schemas/` (zod).

- **Types shared with the API** (request/response shapes) go in `@starter/shared`, not in the feature.
- Scaffold a new slice with `pnpm gen feature <name>`; register its route in `main.tsx`.

### Naming (lint-enforced)

- **kebab-case for all files and folders** (`health-status-card.tsx`, `use-theme.ts`); exports stay PascalCase/camelCase (`HealthStatusCard`, `useTheme`).
- Layer suffixes: `*-service.ts` in `services/`, `*-query.ts` in `queries/`, `use-*.ts` for hooks, `*-page.tsx` in `pages/`.
- Single path alias: `@/` → `src/`. Deep relative imports (`../../../`) are banned.

---

## Shared package (`packages/shared`)

`@starter/shared` holds the **API wire contract**: request/response types used by both the API (as the shape services return) and the web app (as the shape services fetch).

```
packages/shared/src/
├── types/
│   ├── health.types.ts     # HealthStatus
│   ├── user.types.ts       # UserResponse, CreateUserRequest
│   └── index.ts
└── index.ts
```

- Wire types use JSON-safe primitives — dates are ISO-8601 **strings**, never `Date`.
- The package builds to `dist/` via `tsc` (`prepare` runs on install; turbo orders `^build` before app builds).
- Keep it dependency-free and framework-agnostic. Runtime code (validators, formatters) is allowed but should be rare; grow additional packages (`packages/<name>`) for bigger shared surfaces.

---

## Enforcement summary

| Mechanism                                   | What it enforces                                                 |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `boundaries/dependencies` (layer policies)  | The layer/feature import matrix above, in both apps              |
| `boundaries/dependencies` (barrel policies) | Cross-module imports go through barrels (`index.ts`)             |
| `no-restricted-imports`                     | No `../../../` imports; Prisma client fenced into `src/database` |
| `check-file/filename-naming-convention`     | kebab-case file names                                            |
| `check-file/folder-naming-convention`       | kebab-case folder names                                          |
| `pnpm gen feature\|module`                  | New code starts in the canonical shape                           |
| `turbo build` (`dependsOn: ^build`)         | `@starter/shared` builds before the apps                         |

Run `pnpm lint` (or `pnpm check`) to verify; CI should gate on it.

---

## Adding new code — decision table

| I'm adding...                       | It goes in...                                                   |
| ----------------------------------- | --------------------------------------------------------------- |
| A new business domain (API)         | `pnpm gen module <name>` → `apps/api/src/core/<name>/`          |
| A DB entity                         | `prisma/schema.prisma` + repo in `apps/api/src/database/repos/` |
| Mail/queue/storage/external service | `apps/api/src/integrations/<name>/`                             |
| A guard/interceptor used everywhere | `apps/api/src/common/`                                          |
| A new screen/domain (web)           | `pnpm gen feature <name>` → `apps/web/src/features/<name>/`     |
| An HTTP call                        | `features/<x>/services/` (via `@/lib/api-client`)               |
| A request/response type             | `packages/shared/src/types/`                                    |
| A generic UI primitive              | `npx shadcn@latest add ...` → `components/ui/`                  |
| An app-specific reusable component  | `apps/web/src/components/common/`                               |
