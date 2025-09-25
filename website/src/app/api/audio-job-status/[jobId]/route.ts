import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/dual-auth';

interface LanguageStatus {
  status: string;
  audio_url?: string;
  draft?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  // Authenticate the request
  const authResult = await authenticateRequest(request)
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const supabase = authResult.supabaseClient;
  const { jobId } = params;

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  try {
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('status, audio_url, audio_urls, language_statuses, languages, error_message')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "Not a single row was returned"
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      console.error('Error fetching job status:', error);
      throw error;
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // For completed jobs, get the audio URL from audio_urls or language_statuses
    let audioUrl = job.audio_url;
    
    if (job.status === 'complete' && job.audio_urls) {
      // Get the first available audio URL from audio_urls object
      const audioUrls = job.audio_urls;
      const firstLanguage = job.languages?.[0] || 'en';
      audioUrl = audioUrls[firstLanguage] || Object.values(audioUrls)[0];
    }
    
    // If still no audio URL, check language_statuses
    if (!audioUrl && job.language_statuses) {
      const languageStatuses = job.language_statuses as Record<string, LanguageStatus>;
      for (const [lang, status] of Object.entries(languageStatuses)) {
        if (status.audio_url) {
          audioUrl = status.audio_url;
          break;
        }
      }
    }

    const response = {
      status: job.status,
      audio_url: audioUrl,
      error_message: job.error_message,
      languages: job.languages || ['en'],
      language_statuses: job.language_statuses || {},
      audio_urls: job.audio_urls || {}
    };

    console.log(`[audio-job-status] Job ${jobId} status: ${job.status}, audio_url: ${audioUrl}`);
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error(`Failed to fetch status for job ${jobId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}