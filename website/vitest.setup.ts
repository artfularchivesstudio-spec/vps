import { config } from 'dotenv'
import path from 'path'
import * as matchers from '@testing-library/jest-dom/matchers'
import { vi } from 'vitest'

config({ path: path.resolve(__dirname, '.env.test') })

// Mock next/headers with full cookie methods
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn((name) => ({ name, value: 'mock-value' })),
    set: vi.fn(),
    getAll: vi.fn(() => []),
    setAll: vi.fn(),
  }),
}))

// Safely extend expect if available
if (
  typeof (globalThis as any).expect !== 'undefined' &&
  typeof (globalThis as any).expect.extend === 'function'
) {
  // @ts-ignore
  ;(globalThis as any).expect.extend(matchers)
}


