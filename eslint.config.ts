import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import type { ESLint } from 'eslint';
import stylexPlugin from '@stylexjs/eslint-plugin';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// StyleX 0.18 uses an older rule metadata type, but its runtime shape is ESLint-compatible.
const stylexPluginForEslint = stylexPlugin as unknown as ESLint.Plugin;

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**', 'qa/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['vite.config.ts'],
    rules: {
      // @stylexjs/unplugin currently declares its Vite plugin factory as any[].
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    files: ['src/**/*.tsx'],
    plugins: {
      '@stylexjs': stylexPluginForEslint,
      react,
      'react-refresh': reactRefresh,
    },
    rules: {
      '@stylexjs/valid-styles': 'error',
      '@stylexjs/no-unused': 'error',
      'react/jsx-uses-vars': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]);
