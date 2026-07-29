# Changelog

## [0.4.0](https://github.com/cperuffo3/monorepo-starter/compare/v0.3.0...v0.4.0) (2026-07-29)

### Refactoring

* migrate eslint boundaries config to v7 policy syntax ([950a069](https://github.com/cperuffo3/monorepo-starter/commit/950a069bd051902d76bf3abc1f35ce80047b81f8))

### Chores

* **deps:** bump minor and major dependency groups ([c16f4a5](https://github.com/cperuffo3/monorepo-starter/commit/c16f4a5d4e65895f71abe1c3becb2e6d507307f7)), references [#119](https://github.com/cperuffo3/monorepo-starter/issues/119)
* update local claude-code permission grants ([e52a27f](https://github.com/cperuffo3/monorepo-starter/commit/e52a27ff115c0e0f37b4aed065e27a08b4718735))

## [0.3.0](https://github.com/cperuffo3/monorepo-starter/compare/v0.2.0...v0.3.0) (2026-07-03)

### Features

- enforce layered architecture with lint boundaries and scaffolding ([1de9460](https://github.com/cperuffo3/monorepo-starter/commit/1de9460fbcd477d832420c0c4d7b7e8e62c52052))

## [0.2.0](https://github.com/cperuffo3/monorepo-starter/compare/v0.1.5...v0.2.0) (2026-06-10)

### Features

- improve releasing strategy ([5173194](https://github.com/cperuffo3/monorepo-starter/commit/5173194f1d62208aca94a3a0c73a9efeec5a82aa))
- install all shadcn components and fix formatting ([2c3e347](https://github.com/cperuffo3/monorepo-starter/commit/2c3e34755bd2036a963099d6415422b5c5595e32))

### Bug Fixes

- cursor-pointer and new icon library added ([dec0047](https://github.com/cperuffo3/monorepo-starter/commit/dec00470502545a65ef1d16b22a4b721a8e1ec26))
- linting errors ([8f8d45c](https://github.com/cperuffo3/monorepo-starter/commit/8f8d45c5d561af95ce639d32b9fe744869cacc8f))
- update packages ([6f75e3f](https://github.com/cperuffo3/monorepo-starter/commit/6f75e3f31944b64dd6044c94fefe7e4b989c13fd))
- update to pnpm v11 ([444988f](https://github.com/cperuffo3/monorepo-starter/commit/444988f301c5ca6a49ff15ff6ac569a46877b418))

All notable changes to this template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Initial Release

### Added

- NestJS API with Prisma ORM and PostgreSQL
- Vite + React 19 frontend with TypeScript
- Tailwind CSS v4 with shadcn/ui components
- Docker Compose for local PostgreSQL development
- Turborepo for monorepo orchestration
- pnpm workspaces for package management
- Changesets for version management
- Project initialization script (`pnpm init-project`)
- OpenAPI/Swagger documentation at `/api/openapi`
- Health check endpoint at `/api/v1/health`
- Custom logging service with request context
- ESLint + Prettier configuration
- Dependabot for automated dependency updates
