/**
 * 🌟 The Grand Logger of Babel's Tower - A Poetic Chronicle of Digital Dreams
 *
 * "In the grand theatre of code, where functions dance like fireflies in the twilight,
 * Our logger stands as the eloquent bard, weaving tales of triumphs and tribulations.
 * With emojis as his colorful quill and correlation IDs as his golden thread,
 * He chronicles every saga, every epic quest, every humble subroutine's dread."
 *
 * - Oscar Wilde (if he coded in TypeScript)
 */

import { createClient } from '@/lib/supabase/client'

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'
type ErrorSource = 'frontend' | 'api' | 'storage' | 'ai' | 'auth' | 'audio' | 'worker' | 'admin-auth-service' | 'client-admin-auth' | 'auth-state-manager' | 'client-auth-state-manager'

interface LogErrorParams {
  type: string
  message: string
  stack?: string
  userId?: string
  sessionId?: string
  requestData?: any
  responseData?: any
  severity?: ErrorSeverity
  source?: ErrorSource
  correlationId?: string
}

interface LogApiUsageParams {
  provider: 'openai' | 'claude' | 'elevenlabs' | 'translation_system' | 'custom'
  operation: string
  model?: string
  tokensUsed?: number
  costEstimate?: number
  durationMs?: number
  userId?: string
  sessionId?: string
  success?: boolean
  errorMessage?: string
  requestSizeBytes?: number
  responseSizeBytes?: number
  correlationId?: string
}

interface LogAudioJobParams {
  jobId: string
  operation: 'translation_hit' | 'translation_miss' | 'enhancement_latency' | 'tts_latency' | 'storage_upload' | 'subtitle_generation' | 'audio_concatenation'
  language?: string
  durationMs?: number
  sizeBytes?: number
  success?: boolean
  errorMessage?: string
  cacheHit?: boolean
  costEstimate?: number
  correlationId?: string
  userId?: string
  sessionId?: string
}

/**
 * 🎭 The Grand Logger - Chronicler of Digital Tales
 *
 * "Like a bard in the court of King Algorithm,
 * I weave tapestries of code with threads of wisdom.
 * Each log entry a stanza, each error a dramatic turn,
 * Together we compose the epic of our system's sojourn."
 *
 * - The Digital Bard
 */
class Logger {
  private supabase = createClient()
  private sessionId: string

  constructor() {
    // Generate a unique session ID for this page load
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate correlation ID for tracking related operations
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${this.sessionId}`
  }

  async logError({
    type,
    message,
    stack,
    userId,
    sessionId = this.sessionId,
    requestData,
    responseData,
    severity = 'error',
    source = 'frontend',
    correlationId
  }: LogErrorParams): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('log_error', {
        p_error_type: type,
        p_error_message: message,
        p_error_stack: stack,
        p_user_id: userId,
        p_session_id: sessionId,
        p_request_data: requestData,
        p_response_data: responseData,
        p_severity: severity,
        p_source: source
      })

      if (error) {
        console.error('Failed to log error to database:', error)
        return null
      }

      // Also log to external analytics
      this.logToExternalAnalytics('error', {
        type,
        message,
        severity,
        source,
        correlationId
      })

      return data
    } catch (err) {
      console.error('Exception while logging error:', err)
      return null
    }
  }

  async logApiUsage({
    provider,
    operation,
    model,
    tokensUsed,
    costEstimate,
    durationMs,
    userId,
    sessionId = this.sessionId,
    success = true,
    errorMessage,
    requestSizeBytes,
    responseSizeBytes,
    correlationId
  }: LogApiUsageParams): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('log_api_usage', {
        p_provider: provider,
        p_operation: operation,
        p_model: model,
        p_tokens_used: tokensUsed,
        p_cost_estimate: costEstimate,
        p_duration_ms: durationMs,
        p_user_id: userId,
        p_session_id: sessionId,
        p_success: success,
        p_error_message: errorMessage,
        p_request_size_bytes: requestSizeBytes,
        p_response_size_bytes: responseSizeBytes
      })

      if (error) {
        console.error('Failed to log API usage to database:', error)
        return null
      }

      // Also log to external analytics (Vercel Analytics, Grafana)
      this.logToExternalAnalytics('api_usage', {
        provider,
        operation,
        model,
        durationMs,
        costEstimate,
        correlationId
      })

      return data
    } catch (err) {
      console.error('Exception while logging API usage:', err)
      return null
    }
  }

  async logAudioJob({
    jobId,
    operation,
    language,
    durationMs,
    sizeBytes,
    success = true,
    errorMessage,
    cacheHit,
    costEstimate,
    correlationId,
    userId,
    sessionId = this.sessionId
  }: LogAudioJobParams): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('log_audio_job_metrics', {
        p_job_id: jobId,
        p_operation: operation,
        p_language: language,
        p_duration_ms: durationMs,
        p_size_bytes: sizeBytes,
        p_success: success,
        p_error_message: errorMessage,
        p_cache_hit: cacheHit,
        p_cost_estimate: costEstimate,
        p_correlation_id: correlationId,
        p_user_id: userId,
        p_session_id: sessionId
      })

      if (error) {
        console.error('Failed to log audio job metrics to database:', error)
        return null
      }

      // Log to external analytics with structured data
      this.logToExternalAnalytics('audio_job', {
        jobId,
        operation,
        language,
        durationMs,
        sizeBytes,
        cacheHit,
        costEstimate,
        correlationId
      })

      return data
    } catch (err) {
      console.error('Exception while logging audio job metrics:', err)
      return null
    }
  }

  // Log to external analytics services (Vercel Analytics, Grafana)
  private async logToExternalAnalytics(eventType: string, data: any): Promise<void> {
    try {
      // Vercel Analytics (client-side only)
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', {
          name: `audio_${eventType}`,
          properties: data
        })
      }

      // Grafana Loki structured logging
      const grafanaPayload = {
        streams: [{
          stream: {
            job: 'artful-archives-audio',
            level: 'info',
            event_type: eventType
          },
          values: [[
            (Date.now() * 1000000).toString(), // nanoseconds
            JSON.stringify(data)
          ]]
        }]
      }

      // Send to Grafana Loki endpoint (would need to be configured)
      // await fetch(process.env.GRAFANA_LOKI_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(grafanaPayload)
      // })

      // For now, just log to console with structured format
      console.log(`📊 [${eventType.toUpperCase()}]`, JSON.stringify(data, null, 2))

    } catch (err) {
      console.warn('Failed to log to external analytics:', err)
    }
  }

  // Convenience methods for common error types
  async logUploadError(message: string, error: any, userId?: string, correlationId?: string) {
    return this.logError({
      type: 'upload_error',
      message,
      stack: error?.stack || JSON.stringify(error),
      userId,
      severity: 'error',
      source: 'storage',
      requestData: { error },
      correlationId
    })
  }

  async logAiError(provider: 'openai' | 'claude' | 'translation_system' | 'custom', message: string, error: any, userId?: string, correlationId?: string) {
    return this.logError({
      type: 'ai_error',
      message: `${provider}: ${message}`,
      stack: error?.stack || JSON.stringify(error),
      userId,
      severity: 'error',
      source: 'ai',
      requestData: { provider, error },
      correlationId
    })
  }

  async logApiError(endpoint: string, message: string, error: any, userId?: string, correlationId?: string) {
    return this.logError({
      type: 'api_error',
      message: `${endpoint}: ${message}`,
      stack: error?.stack || JSON.stringify(error),
      userId,
      severity: 'error',
      source: 'api',
      requestData: { endpoint, error },
      correlationId
    })
  }

  async logAudioError(operation: string, message: string, error: any, jobId: string, language?: string, correlationId?: string) {
    return this.logError({
      type: 'audio_error',
      message: `${operation}: ${message}`,
      stack: error?.stack || JSON.stringify(error),
      severity: 'error',
      source: 'audio',
      requestData: { operation, jobId, language, error },
      correlationId
    })
  }

  async logWorkerError(operation: string, message: string, error: any, jobId: string, correlationId?: string) {
    return this.logError({
      type: 'worker_error',
      message: `${operation}: ${message}`,
      stack: error?.stack || JSON.stringify(error),
      severity: 'error',
      source: 'worker',
      requestData: { operation, jobId, error },
      correlationId
    })
  }

  // Success logging
  async logSuccess(type: string, message: string, data?: any, userId?: string, correlationId?: string) {
    return this.logError({
      type,
      message,
      userId,
      severity: 'info',
      requestData: data,
      correlationId
    })
  }

  // Audio-specific convenience methods
  async logTranslationHit(jobId: string, language: string, durationMs: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'translation_hit',
      language,
      durationMs,
      cacheHit: true,
      success: true,
      correlationId
    })
  }

  async logTranslationMiss(jobId: string, language: string, durationMs: number, costEstimate?: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'translation_miss',
      language,
      durationMs,
      cacheHit: false,
      costEstimate,
      success: true,
      correlationId
    })
  }

  async logTtsLatency(jobId: string, language: string, durationMs: number, sizeBytes: number, costEstimate?: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'tts_latency',
      language,
      durationMs,
      sizeBytes,
      costEstimate,
      success: true,
      correlationId
    })
  }

  async logEnhancementLatency(jobId: string, language: string, durationMs: number, costEstimate?: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'enhancement_latency',
      language,
      durationMs,
      costEstimate,
      success: true,
      correlationId
    })
  }

  async logStorageUpload(jobId: string, language: string, sizeBytes: number, durationMs: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'storage_upload',
      language,
      sizeBytes,
      durationMs,
      success: true,
      correlationId
    })
  }

  async logSubtitleGeneration(jobId: string, language: string, durationMs: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'subtitle_generation',
      language,
      durationMs,
      success: true,
      correlationId
    })
  }

  async logAudioConcatenation(jobId: string, language: string, durationMs: number, sizeBytes: number, correlationId?: string) {
    return this.logAudioJob({
      jobId,
      operation: 'audio_concatenation',
      language,
      durationMs,
      sizeBytes,
      success: true,
      correlationId
    })
  }

  getSessionId() {
    return this.sessionId
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for use in other files
export type { ErrorSeverity, ErrorSource, LogApiUsageParams, LogAudioJobParams, LogErrorParams }
