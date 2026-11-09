import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

// Resolve o alias `@/` (mesmo do tsconfig) sem depender de plugin extra.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // `server-only` lança fora do bundler do Next; nos testes vira módulo vazio.
      'server-only': resolve(__dirname, 'src/test/server-only-stub.ts'),
    },
  },
})
