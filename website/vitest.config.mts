import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['src/__tests__/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
    exclude: ['tests/**', 'supabase/functions/**/legacy/**', 'src/__tests__/legacy/**'],
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})


