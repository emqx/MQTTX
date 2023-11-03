import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['**/*.test.{ts,js}'],
  },
})
