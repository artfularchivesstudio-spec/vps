/**
 * @file Server-Sent Events (SSE) streaming endpoint for ChatGPT Actions
 * Provides real-time audio job status updates instead of polling
 * Implements callback_url functionality for immediate status notifications
 *
 * Features:
 * 1. Server-Sent Events for real-time updates
 * 2. Callback URL notifications for external services
 * 3. Correlation ID tracking for request chaining
 * 4. Progress streaming with emoji-rich status messages
 */

// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(`Missing required environment variables`);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory store for active streaming connections (in production, use Redis/pubsub)
const activeStreams = new Map<string, { controller: ReadableStreamDefaultController, correlationId: string }>();

interface StreamingOptions {
  jobId: string;
  correlationId?: string;
  callbackUrl?: string;
  includeProgress?: boolean;
  language?: string;
}

class StreamingManager {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  // Send data to all active streams for a job
  broadcastToJob(jobId: string, data: any) {
    const streamKey = `job_${jobId}`;
    const stream = activeStreams.get(streamKey);

    if (stream) {
      try {
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        stream.controller.enqueue(new TextEncoder().encode(eventData));
      } catch (error) {
        console.warn(`Failed to broadcast to stream ${streamKey}:`, error);
        activeStreams.delete(streamKey);
      }
    }
  }

  // Send callback to external service
  async sendCallback(callbackUrl: string, data: any) {
    try {
      console.log(`📡 Sending callback to ${callbackUrl}`);
      await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      console.log(`✅ Callback sent successfully`);
    } catch (error) {
      console.error(`❌ Callback failed:`, error);
    }
  }

  // Get enhanced status with emoji-rich messages
  getStatusMessage(status: string, language?: string, progress?: number): string {
    const statusMessages = {
      'pending': '⏳ Job queued and waiting to start',
      'processing': `🔄 Processing ${language ? language.toUpperCase() : 'content'}... ${progress ? `${progress}%` : ''}`,
      'translating': `🌍 Translating to ${language?.toUpperCase()}...`,
      'enhancing': `🎭 Enhancing text with AI persona...`,
      'generating_audio': `🎤 Generating audio for ${language?.toUpperCase()}...`,
      'storing_files': '☁️ Storing audio files...',
      'complete': '✅ Job completed successfully!',
      'failed': '❌ Job failed - check error details'
    };

    return statusMessages[status] || status;
  }

  // Monitor job changes and broadcast updates
  async monitorJob(jobId: string, options: StreamingOptions) {
    console.log(`👀 Starting to monitor job ${jobId}`);

    // Initial status
    let lastStatus = null;
    let lastProgress = null;

    const monitor = async () => {
      try {
        const { data: job, error } = await this.supabase
          .from('audio_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error fetching job status:', error);
          return;
        }

        const currentStatus = job.status;
        const currentProgress = job.processed_chunks && job.total_chunks
          ? Math.round((job.processed_chunks / job.total_chunks) * 100)
          : null;

        // Broadcast if status changed
        if (currentStatus !== lastStatus || currentProgress !== lastProgress) {
          const statusMessage = this.getStatusMessage(currentStatus, options.language, currentProgress);

          const updateData = {
            job_id: jobId,
            status: currentStatus,
            progress: currentProgress,
            message: statusMessage,
            timestamp: new Date().toISOString(),
            correlation_id: options.correlationId,
            language: options.language,
            processed_chunks: job.processed_chunks,
            total_chunks: job.total_chunks,
            completed_languages: job.completed_languages,
            languages: job.languages
          };

          console.log(`📊 Job ${jobId} update: ${currentStatus} (${currentProgress}%)`);

          // Broadcast to SSE streams
          this.broadcastToJob(jobId, updateData);

          // Send callback if provided
          if (options.callbackUrl) {
            await this.sendCallback(options.callbackUrl, updateData);
          }

          lastStatus = currentStatus;
          lastProgress = currentProgress;
        }

        // Continue monitoring if job is not complete or failed
        if (currentStatus !== 'complete' && currentStatus !== 'failed') {
          setTimeout(monitor, 2000); // Poll every 2 seconds
        } else {
          console.log(`🏁 Monitoring complete for job ${jobId}`);

          // Send final update and close stream
          const finalData = {
            job_id: jobId,
            status: currentStatus,
            message: this.getStatusMessage(currentStatus),
            timestamp: new Date().toISOString(),
            correlation_id: options.correlationId,
            final: true,
            audio_urls: job.audio_urls,
            error_message: job.error_message
          };

          this.broadcastToJob(jobId, finalData);

          if (options.callbackUrl) {
            await this.sendCallback(options.callbackUrl, finalData);
          }

          // Clean up stream
          activeStreams.delete(`job_${jobId}`);
        }

      } catch (error) {
        console.error('Error in job monitoring:', error);
        activeStreams.delete(`job_${jobId}`);
      }
    };

    // Start monitoring
    monitor();
  }
}

serve(async (req) => {
  console.log('[audio-job-streaming] Request received:', req.method, req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    const correlationId = url.searchParams.get('correlationId') || `stream-${Date.now()}`;
    const callbackUrl = url.searchParams.get('callbackUrl');
    const language = url.searchParams.get('language');

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const streamingManager = new StreamingManager(supabase);

    // For SSE requests, establish streaming connection
    if (req.headers.get('accept') === 'text/event-stream') {
      console.log(`🎬 Establishing SSE stream for job ${jobId}`);

      const stream = new ReadableStream({
        start(controller) {
          // Store the controller for broadcasting
          activeStreams.set(`job_${jobId}`, {
            controller,
            correlationId
          });

          // Send initial connection message
          const initData = {
            type: 'connection_established',
            job_id: jobId,
            message: '🔗 Streaming connection established',
            timestamp: new Date().toISOString(),
            correlation_id: correlationId
          };

          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(initData)}\n\n`));

          // Start monitoring the job
          const options: StreamingOptions = {
            jobId,
            correlationId,
            callbackUrl: callbackUrl || undefined,
            includeProgress: true,
            language: language || undefined
          };

          streamingManager.monitorJob(jobId, options);
        },
        cancel() {
          console.log(`🔌 SSE stream cancelled for job ${jobId}`);
          activeStreams.delete(`job_${jobId}`);
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      });
    }

    // For regular HTTP requests, return current status
    console.log(`📊 Returning current status for job ${jobId}`);

    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const progress = job.processed_chunks && job.total_chunks
      ? Math.round((job.processed_chunks / job.total_chunks) * 100)
      : null;

    const response = {
      job_id: jobId,
      status: job.status,
      progress,
      message: streamingManager.getStatusMessage(job.status, language, progress),
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      language,
      processed_chunks: job.processed_chunks,
      total_chunks: job.total_chunks,
      completed_languages: job.completed_languages,
      languages: job.languages,
      audio_urls: job.audio_urls,
      error_message: job.error_message
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[audio-job-streaming] Error:', error);

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
