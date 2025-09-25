import { LogEvent, logManager, LogProvider } from '@/lib/observability/log-manager'
import { beforeEach, describe, expect, it } from 'vitest'

// 🧪✨ Ensures our LogManager sends each log to every provider like a gossiping bard.
describe('logManager', () => {
  beforeEach(() => {
    // Set up environment variables for tests
    process.env.SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    
    // Clear any existing providers
    logManager.clearProviders()
  })

  it('dispatches logs to registered providers', async () => {
    // 📝 Mock provider to capture the whispered secrets 📜
    const received: LogEvent[] = []
    const testProvider: LogProvider = {
      async log(event) {
        received.push(event)
      }
    }

    logManager.addProvider(testProvider)
    await logManager.log({ level: 'info', message: 'hello there' })

    expect(received).toHaveLength(1)
    expect(received[0].message).toBe('hello there')
  })
})
