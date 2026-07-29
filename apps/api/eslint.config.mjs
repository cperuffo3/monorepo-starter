/**
 * ESLint configuration for the NestJS API.
 * Uses flat config format (ESLint 9+).
 *
 * Architectural boundaries (eslint-plugin-boundaries) enforce the layer
 * taxonomy documented in .documentation/devdocs/organization.md:
 *
 *   common       → cross-cutting plumbing; may not import any other layer
 *   database     → persistence (PrismaService, repos, entity types)
 *   core         → domain modules; talk to the DB only through database repos
 *   integrations → infrastructure modules (health, mail, queue, ...)
 */
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      boundaries,
      'check-file': checkFile,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'common', pattern: 'src/common' },
        { type: 'database', pattern: 'src/database' },
        { type: 'core-root', pattern: 'src/core/*', mode: 'file' },
        { type: 'core', pattern: 'src/core/*', capture: ['moduleName'] },
        { type: 'integrations', pattern: 'src/integrations/*', capture: ['moduleName'] },
        { type: 'app', pattern: 'src/*', mode: 'full' },
      ],
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/../../..*'],
              message:
                'Deep relative imports (3+ levels up) are banned — import from a layer barrel instead (e.g. ../../database/index.js).',
            },
            {
              group: ['**/prisma/generated/**'],
              message:
                'Only src/database may import the generated Prisma client. Import entity types from the database barrel instead.',
            },
          ],
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{from.element.type}} code may not import {{to.element.type}} code (see .documentation/devdocs/organization.md)',
          policies: [
            {
              from: { element: { type: 'common' } },
              allow: { to: { element: { type: 'common' } } },
            },
            {
              from: { element: { type: 'database' } },
              allow: { to: { element: { type: ['database', 'common'] } } },
            },
            {
              from: { element: { type: 'core' } },
              allow: {
                to: {
                  element: {
                    type: ['core', 'core-root', 'common', 'database', 'integrations'],
                  },
                },
              },
            },
            {
              from: { element: { type: 'core-root' } },
              allow: { to: { element: { type: ['core', 'core-root'] } } },
            },
            {
              from: { element: { type: 'integrations' } },
              allow: {
                to: [
                  { element: { type: ['common', 'database'] } },
                  {
                    element: {
                      type: 'integrations',
                      captured: { moduleName: '{{from.element.captured.moduleName}}' },
                    },
                  },
                ],
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: {
                    type: ['common', 'database', 'core', 'core-root', 'integrations', 'app'],
                  },
                },
              },
            },
            // Barrel enforcement (formerly boundaries/entry-point, deprecated in v7).
            // Policies are last-match-wins, so these must stay last: they add
            // disallows on top of whatever the layer policies above allowed.
            {
              to: { element: { type: ['core', 'integrations', 'database'] } },
              disallow: { to: { element: { fileInternalPath: '!index.ts' } } },
              message:
                'Import {{to.element.type}} modules through their barrel (index.ts), not internal files',
            },
          ],
        },
      ],
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.ts': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
    },
  },
  {
    // The database layer is the only place allowed to import the generated
    // Prisma client, so drop the fence there (keep the deep-relative ban).
    files: ['src/database/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/../../..*'],
              message:
                'Deep relative imports (3+ levels up) are banned — import from a layer barrel instead (e.g. ../../database/index.js).',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'prisma/generated/**'],
  },
);
