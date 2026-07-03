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
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message:
            '${file.type} code may not import ${dependency.type} code (see .documentation/devdocs/organization.md)',
          rules: [
            { from: 'common', allow: ['common'] },
            { from: 'database', allow: ['database', 'common'] },
            {
              from: 'core',
              allow: ['core', 'core-root', 'common', 'database', 'integrations'],
            },
            { from: 'core-root', allow: ['core', 'core-root'] },
            {
              from: 'integrations',
              allow: [
                'common',
                'database',
                ['integrations', { moduleName: '${from.moduleName}' }],
              ],
            },
            {
              from: 'app',
              allow: ['common', 'database', 'core', 'core-root', 'integrations', 'app'],
            },
          ],
        },
      ],
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          message:
            'Import ${dependency.type} modules through their barrel (index.ts), not internal files',
          rules: [
            { target: ['core', 'integrations', 'database'], allow: 'index.ts' },
            { target: ['common', 'core-root', 'app'], allow: '**' },
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
