/**
 * 🧙‍♂️ LogManager - The grand wizard routing every log spell to all eager scribes.
 * Each provider is a scribe; together they chronicle our app's saga in multiple tomes.
 */

import { createServiceClient } from '@/lib/supabase/server'

export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEvent {
  level: LogLevel
  message: string
  context?: Record<string, any>
}

/** ✍️ A humble interface all log scribes must follow */
export interface LogProvider {
  log: (event: LogEvent) => Promise<void>
}

/** 🎤 ConsoleLogProvider - shouts logs into the void (a.k.a. stdout) */
class ConsoleLogProvider implements LogProvider {
  async log(event: LogEvent): Promise<void> {
    const payload = { ...event, timestamp: new Date().toISOString() }
    // eslint-disable-next-line no-console
    console[event.level](`📜 [${payload.timestamp}] ${event.message}`, event.context)
  }
}

/** 🗄️ SupabaseLogProvider - stores logs in the database for posterity */
class SupabaseLogProvider implements LogProvider {
  private supabase = createServiceClient()

  async log(event: LogEvent): Promise<void> {
    try {
      await this.supabase.from('log_entries').insert({
        level: event.level,
        message: event.message,
        context: event.context,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to persist log', error)
    }
  }
}

/**
 * 🤹‍♀️ The ringmaster juggling logs to every provider
 */
class LogManager {
  private providers: LogProvider[] = []

  addProvider(provider: LogProvider) {
    this.providers.push(provider)
  }

  clearProviders() {
    this.providers = []
  }

  async log(event: LogEvent): Promise<void> {
    await Promise.all(this.providers.map(p => p.log(event)))
  }
}

// 🎪 Our singleton ringmaster ready for action
export const logManager = new LogManager()
logManager.addProvider(new ConsoleLogProvider())

// Only add SupabaseLogProvider if environment variables are available
try {
  logManager.addProvider(new SupabaseLogProvider())
} catch (error) {
  // Silently skip SupabaseLogProvider if environment is not configured
  // This allows the log manager to work in test environments
}
