# Changesets

This folder contains changesets - markdown files that describe changes to the template.

## For Template Maintainers

When making changes to the template:

1. Run `pnpm changeset` to create a new changeset
2. Select affected packages (or choose "all packages" for infrastructure changes)
3. Choose the appropriate version bump (patch, minor, major)
4. Describe what changed and why - this becomes the CHANGELOG entry

The CHANGELOG serves as a migration guide for users updating their forks.

## For Template Users

After running `pnpm init-project`, this folder will be reset for your project's use.

When you want to track changes to your own project:

1. Run `pnpm changeset` after making changes
2. Run `pnpm changeset:version` to update versions and CHANGELOG
