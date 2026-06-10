# Releasing

This monorepo uses [**Conventional Commits**](https://www.conventionalcommits.org/) and [**release-it**](https://github.com/release-it/release-it) (with the `@release-it/conventional-changelog` plugin) to bump the version, regenerate `CHANGELOG.md`, tag the release, push it, and create the GitHub Release — all from **one command, run locally**.

Every package shares **one version**. The root `package.json`, `apps/api`, `apps/web`, anything under `packages/`, the changelog, and the git tag all move together on every release. There is no per-package versioning.

## Branch model

One long-lived branch:

| Branch   | Purpose                                                                        |
| :------- | :---------------------------------------------------------------------------- |
| `master` | Integration + release branch. All work lands here via PRs; releases cut here. |

Feature work happens on short-lived branches that PR into `master`. `release-it` refuses to run from any other branch — see `.release-it.json` (`requireBranch: "master"`).

```
master ──●──●──●──●──●──●──●──●──●──●──
                 ↑       ↑        ↑
             v0.1.5   v0.1.6   v0.2.0     (release commits + tags live on master)
```

## Workflow

### 1. Create a branch

```bash
git checkout master
git pull
git checkout -b feat/my-change
```

Branch prefixes (match the Conventional Commit types):

| Prefix      | Purpose                               |
| :---------- | :------------------------------------ |
| `feat/`     | New feature                           |
| `fix/`      | Bug fix                               |
| `perf/`     | Performance work                      |
| `refactor/` | Restructuring without behavior change |
| `docs/`     | Documentation only                    |
| `test/`     | Test-only changes                     |
| `chore/`    | Dependencies, config, cleanup         |

### 2. Make your changes — commit with conventional messages

Commit messages **feed the changelog** when release-it runs, so follow Conventional Commits:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:

```
feat: add user authentication endpoint
fix(api): handle null viewBox in health check
perf(web): memoize expensive query selectors
chore(deps): bump the minor group
```

The `conventionalcommits` preset is configured in `.release-it.json` with these section mappings:

| Type                                   | Shows under   | In changelog? |
| :------------------------------------- | :------------ | :------------ |
| `feat`                                 | Features      | yes           |
| `fix`                                  | Bug Fixes     | yes           |
| `perf`                                 | Performance   | yes           |
| `refactor`                             | Refactoring   | yes           |
| `docs`                                 | Documentation | yes           |
| `chore`                                | —             | hidden        |
| `style`                                | —             | hidden        |
| `test`                                 | —             | hidden        |
| `ci`                                   | —             | hidden        |
| `!` suffix / `BREAKING CHANGE:` footer | major bump    | highlighted   |

### 3. Open a PR into `master`

```bash
git push -u origin feat/my-change
# Open PR → master on GitHub
```

Prefer **squash merge** with a conventional-commit title, or **rebase merge** to keep commits as authored. Avoid merge commits — they muddy the history that `conventional-changelog` reads when generating release notes.

### 4. Cut a release

Releases are driven **locally** from a clean `master` checkout:

```bash
git checkout master
git pull

# Pick one:
pnpm run release          # interactive — release-it prompts for the bump
pnpm run release:patch    # 0.1.5 → 0.1.6
pnpm run release:minor    # 0.1.5 → 0.2.0
pnpm run release:major    # 0.1.5 → 1.0.0
```

What release-it does, in order (see `.release-it.json`):

1. **`before:init` hooks** — runs `pnpm run lint` and `pnpm run type-check`. The release aborts if either fails.
2. Determines the next version (from the CLI flag, or interactively / from the conventional commits).
3. Bumps `version` in the root `package.json`.
4. **`after:bump` hooks** —
   - `node scripts/sync-versions.mjs ${version}` propagates the new version to **every** workspace package (`apps/*`, `packages/*`) so all components stay in lockstep.
   - `pnpm install --lockfile-only` refreshes the lockfile's version references.
5. Regenerates `CHANGELOG.md` via `@release-it/conventional-changelog` from commits since the last tag.
6. Commits everything (`git commit -a`) with message `chore: release v${version}`.
7. Tags `v${version}` (annotation `Release v${version}`) and pushes the commit + tag to `origin/master`.
8. Creates the **GitHub Release** (`github.release: true`), named `v${version}`, with the generated changelog as the body.

`release-it` is configured with:

- `github.release: true` — release-it creates the GitHub Release itself. No CI workflow is involved in releasing.
- `npm.publish: false` — these are private apps; nothing is published to npm.
- `git.requireBranch: "master"` / `requireCleanWorkingDir: true` / `requireUpstream: true` — release-it refuses to run unless you're on `master`, clean, and tracking a remote.
- `git.commitArgs: ["-a"]` — stages the bumped workspace `package.json` files and the lockfile alongside the changelog in the release commit.

That's the whole release. There are **no manual steps after** `pnpm run release` — no tag to push by hand, no "Run workflow" button, no editing `CHANGELOG.md`.

## Commands

```bash
# Full interactive release (recommended)
pnpm run release

# Non-interactive bumps
pnpm run release:patch
pnpm run release:minor
pnpm run release:major

# Dry-run (no commits, tags, pushes, or GitHub Release) — sanity check
pnpm run release:dry
```

You should never need to hand-edit `CHANGELOG.md` or any `version` field. If you're tempted to, the release-it config is wrong and we should fix it rather than work around it.

## Setup requirements

release-it needs a GitHub token to push to `master` and create the Release. Provide it in your shell environment as `GITHUB_TOKEN` (or `GH_TOKEN`):

| Where                  | Name                         | Scope needed                                                                 |
| :--------------------- | :--------------------------- | :-------------------------------------------------------------------------- |
| Local shell / `.env`   | `GITHUB_TOKEN` or `GH_TOKEN` | `Contents: Read/Write` (push commits + tags) and permission to create releases on this repo. |

A fine-grained PAT scoped to this repo with **Contents: Read and write** is sufficient. release-it picks the token up from the environment automatically.

## Configuration

- **release-it + changelog** — `.release-it.json` (root).
- **Version sync across workspace packages** — `scripts/sync-versions.mjs`.
- **Release scripts** — `release*` entries in the root `package.json`.

## Example: full cycle

```bash
# Start work
git checkout master && git pull
git checkout -b feat/cool-thing

# ... make changes ...
git add -A
git commit -m "feat: add cool thing"

# Push and open PR → master
git push -u origin feat/cool-thing

# Review, merge to master via squash/rebase. Repeat for more PRs.

# Ready to release?
git checkout master && git pull
pnpm run release          # or :patch / :minor / :major

# release-it lints, type-checks, bumps every package to the same version,
# regenerates the changelog, commits, tags, pushes, and publishes the
# GitHub Release. Done.
```

## Why this model

- **Single version** — the monorepo ships as one product. `scripts/sync-versions.mjs` keeps `apps/*` and `packages/*` pinned to the root version every release, so a tag unambiguously identifies the state of every component.
- **Local, deliberate releases** — release-it runs on a developer machine behind the `requireBranch` / `requireCleanWorkingDir` safety rails. Releasing is an explicit `pnpm run release`, not an accidental side effect of a push.
- **No release CI** — with no build artifacts to publish, release-it creating the GitHub Release directly is the simplest thing that works. One command does everything; there's no workflow to maintain or secret to wire into Actions.
- **PR titles feed the changelog** — the commit message _is_ the release note. If a PR title doesn't describe a user-visible change well, the PR probably isn't ready.
