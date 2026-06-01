import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    environmentOptions: {
      jsdom: {
        url: 'https://codex-pet-preview.test/',
      },
    },
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
