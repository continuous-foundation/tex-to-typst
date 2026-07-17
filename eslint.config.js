import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    // `src/symbols.ts` is generated from `symbols.html`; skip prettier/lint on it.
    ignores: ['dist/**', 'node_modules/**', 'src/symbols.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: false, optionalDependencies: false, peerDependencies: true },
      ],
      'array-callback-return': ['error', { checkForEach: true }],
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          printWidth: 100,
          tabWidth: 2,
          semi: true,
          singleQuote: true,
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'tests/**/*.ts'],
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: true, optionalDependencies: false, peerDependencies: true },
      ],
    },
  },
  prettierConfig,
);
