import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    isolate: true,
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.spec.ts'],
    testTimeout: 10000,
  },
});

