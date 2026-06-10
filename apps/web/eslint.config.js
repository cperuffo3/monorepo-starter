/**
 * ESLint configuration for web application.
 * Uses flat config format (ESLint 9+).
 */
import eslint from '@eslint/js';
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
                'Use path aliases (@/*, @features/*, etc.) instead of deeply nested relative imports (../../ or deeper)',
            },
          ],
        },
      ],
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
