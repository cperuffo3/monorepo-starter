/**
 * ESLint configuration for web application.
 * Uses flat config format (ESLint 9+).
 *
 * Architectural boundaries (eslint-plugin-boundaries) enforce the layer
 * taxonomy documented in .documentation/devdocs/organization.md:
 *
 *   ui                → generic primitives (shadcn/ui); no app knowledge
 *   shared-components → app-specific reusables (components/common, layout)
 *   feature           → self-contained slices; may not import other features
 *   hooks/lib/config  → shared foundations; may not import UI or features
 */
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tailwindCanonicalClasses from 'eslint-plugin-tailwind-canonical-classes';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 2020,
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'tailwind-canonical-classes': tailwindCanonicalClasses,
      boundaries,
      'check-file': checkFile,
    },
    settings: {
      'import/resolver': {
        typescript: {
          // Not tsconfig.json: its `references` field makes unrs-resolver
          // treat it as a solution file and ignore its `paths` mapping.
          project: './tsconfig.eslint.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'ui', pattern: 'src/components/ui' },
        { type: 'shared-components', pattern: 'src/components' },
        { type: 'features-barrel', pattern: 'src/features/index.ts', mode: 'file' },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'hooks', pattern: 'src/hooks' },
        { type: 'lib', pattern: 'src/lib' },
        { type: 'config', pattern: 'src/config' },
        { type: 'providers', pattern: 'src/providers' },
        { type: 'styles', pattern: 'src/styles' },
        { type: 'app', pattern: 'src/*', mode: 'full' },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/../../..*'],
              message:
                'Use the @/* alias instead of deeply nested relative imports (../../ or deeper)',
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
            { from: 'ui', allow: ['ui', 'lib', 'hooks'] },
            {
              from: 'shared-components',
              allow: ['ui', 'shared-components', 'lib', 'hooks', 'config'],
            },
            {
              from: 'feature',
              allow: [
                'ui',
                'shared-components',
                'lib',
                'hooks',
                'config',
                ['feature', { featureName: '${from.featureName}' }],
              ],
            },
            { from: 'features-barrel', allow: ['feature'] },
            { from: 'hooks', allow: ['hooks', 'lib', 'config'] },
            { from: 'lib', allow: ['lib', 'config'] },
            { from: 'config', allow: ['config'] },
            {
              from: 'providers',
              allow: ['ui', 'shared-components', 'lib', 'hooks', 'config'],
            },
            {
              from: 'app',
              allow: [
                'ui',
                'shared-components',
                'feature',
                'features-barrel',
                'hooks',
                'lib',
                'config',
                'providers',
                'styles',
                'app',
              ],
            },
          ],
        },
      ],
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          message: 'Import features through their barrel (index.ts), not internal files',
          rules: [
            { target: ['feature'], allow: 'index.ts' },
            {
              target: [
                'ui',
                'shared-components',
                'features-barrel',
                'hooks',
                'lib',
                'config',
                'providers',
                'styles',
                'app',
              ],
              allow: '**',
            },
          ],
        },
      ],
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
      'tailwind-canonical-classes/tailwind-canonical-classes': [
        'warn',
        {
          cssPath: './src/index.css',
        },
      ],
    },
  },
  {
    // Config files run in Node, not the browser — give them Node globals
    // (e.g. __dirname) so no-undef doesn't flag them.
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // main.tsx is the app entry point (createRoot render) — it has no exports
    // and fast refresh doesn't apply to it, so the only-export-components rule
    // (stricter since react-refresh v0.5) would flag the lazy() route wrapper.
    files: ['src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // shadcn/ui primitives are vendored code managed by the shadcn CLI and
    // regenerated on `npx shadcn@latest add`. Relax the project's stricter
    // stylistic/compiler lints for them so component updates stay drop-in.
    // Hand-written files in this folder (theme-toggle, the barrel) stay strict.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/theme-toggle.tsx', 'src/components/ui/index.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'tailwind-canonical-classes/tailwind-canonical-classes': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'vite.config.d.ts'],
  },
);
