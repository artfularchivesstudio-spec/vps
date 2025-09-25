/**
 * @file Nightly subtitle integrity verification cron job
 * Runs daily to verify subtitle file integrity against stored SHA-256 hashes
 * Sends alerts for any integrity failures and logs verification results
 */

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
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
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SHA-256 hash verification utility
async function verifyFileIntegrity(fileUrl: string, expectedHash: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifying integrity of ${fileUrl}`);

    // Download the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(`❌ Failed to download file: ${response.status}`);
      return false;
    }

    const fileContent = await response.text();

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(fileContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Compare hashes
    const isValid = actualHash === expectedHash;
    console.log(`🔐 Hash verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Expected: ${expectedHash}`);
    console.log(`   Actual:   ${actualHash}`);

    return isValid;
  } catch (error) {
    console.error(`💥 Exception during integrity verification:`, error);
    return false;
  }
}

// Slack/Discord webhook notification
async function sendIntegrityAlert(
  webhookUrl: string,
  jobId: string,
  language: string,
  fileType: 'srt' | 'vtt',
  expectedHash: string,
  actualHash: string
) {
  try {
    const payload = {
      text: `🚨 Subtitle Integrity Alert`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Subtitle File Integrity Failure'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Job ID:* ${jobId}`
            },
            {
              type: 'mrkdwn',
              text: `*Language:* ${language.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*File Type:* ${fileType.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:* ❌ Integrity Check Failed`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Expected Hash:* \`${expectedHash}\`\n*Actual Hash:* \`${actualHash}\``
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔧 Action Required: Verify subtitle file and regenerate if necessary.`
          }
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`📢 Integrity alert sent to ${webhookUrl}`);
  } catch (error) {
    console.error(`❌ Failed to send integrity alert:`, error);
  }
}

serve(async (req) => {
  console.log('[nightly-integrity-check] Starting integrity verification process');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const correlationId = `integrity-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔗 Correlation ID: ${correlationId}`);

    // Get webhook URL from environment (optional)
    const webhookUrl = Deno.env.get('INTEGRITY_ALERT_WEBHOOK_URL');

    // Query subtitle integrity records that need verification
    const { data: integrityRecords, error: queryError } = await supabase
      .from('subtitle_integrity')
      .select('*')
      .or('verification_status.eq.pending,last_verified_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(20); // Process in batches

    if (queryError) {
      console.error('❌ Failed to query integrity records:', queryError);
      throw queryError;
    }

    console.log(`📊 Found ${integrityRecords?.length || 0} records to verify`);

    const results = {
      totalChecked: 0,
      verifiedCount: 0,
      failedCount: 0,
      alertsSent: 0,
      startTime: new Date().toISOString()
    };

    if (integrityRecords && integrityRecords.length > 0) {
      for (const record of integrityRecords) {
        results.totalChecked++;

        console.log(`🔍 Verifying job ${record.job_id} language ${record.language}`);

        // Get the subtitle URLs from the audio_jobs table
        const { data: jobData, error: jobError } = await supabase
          .from('audio_jobs')
          .select('subtitle_urls')
          .eq('id', record.job_id)
          .single();

        if (jobError || !jobData?.subtitle_urls?.[record.language]) {
          console.warn(`⚠️ No subtitle URLs found for job ${record.job_id} language ${record.language}`);
          continue;
        }

        const subtitleUrls = jobData.subtitle_urls[record.language];
        let srtVerified = false;
        let vttVerified = false;

        // Verify SRT file if URL exists
        if (subtitleUrls.srt) {
          srtVerified = await verifyFileIntegrity(subtitleUrls.srt, record.srt_hash);
        }

        // Verify VTT file if URL exists
        if (subtitleUrls.vtt) {
          vttVerified = await verifyFileIntegrity(subtitleUrls.vtt, record.vtt_hash);
        }

        const overallVerified = srtVerified && vttVerified;

        // Update verification status
        const { error: updateError } = await supabase
          .from('subtitle_integrity')
          .update({
            last_verified_at: new Date().toISOString(),
            verification_status: overallVerified ? 'verified' : 'failed'
          })
          .eq('job_id', record.job_id)
          .eq('language', record.language);

        if (updateError) {
          console.error(`❌ Failed to update verification status:`, updateError);
        }

        if (overallVerified) {
          results.verifiedCount++;
          console.log(`✅ Job ${record.job_id} ${record.language} integrity verified`);
        } else {
          results.failedCount++;
          console.error(`❌ Job ${record.job_id} ${record.language} integrity FAILED`);

          // Send alert if webhook URL is configured
          if (webhookUrl) {
            if (!srtVerified && subtitleUrls.srt) {
              await sendIntegrityAlert(
                webhookUrl,
                record.job_id,
                record.language,
                'srt',
                record.srt_hash,
                'verification_failed'
              );
              results.alertsSent++;
            }

            if (!vttVerified && subtitleUrls.vtt) {
              await sendIntegrityAlert(
                webhookUrl,
                record.job_id,
                record.language,
                'vtt',
                record.vtt_hash,
                'verification_failed'
              );
              results.alertsSent++;
            }
          }
        }

        // Log verification result
        await supabase.from('audio_job_logs').insert({
          correlation_id: correlationId,
          level: overallVerified ? 'info' : 'error',
          operation: 'integrity_verification',
          message: `Subtitle integrity ${overallVerified ? 'verified' : 'FAILED'} for job ${record.job_id} language ${record.language}`,
          data: {
            job_id: record.job_id,
            language: record.language,
            srt_verified: srtVerified,
            vtt_verified: vttVerified,
            srt_url: subtitleUrls.srt,
            vtt_url: subtitleUrls.vtt
          },
          created_at: new Date().toISOString()
        });
      }
    }

    // Log summary
    results.endTime = new Date().toISOString();
    results.duration = Date.now() - new Date(results.startTime).getTime();

    await supabase.from('audio_job_logs').insert({
      correlation_id: correlationId,
      level: 'info',
      operation: 'integrity_check_summary',
      message: `Nightly integrity check completed: ${results.verifiedCount}/${results.totalChecked} verified, ${results.failedCount} failed`,
      data: results,
      created_at: new Date().toISOString()
    });

    console.log(`🎯 Integrity check completed:`, results);

    return new Response(JSON.stringify({
      success: true,
      results,
      correlationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[nightly-integrity-check] Error:', error);

    // Log the error
    await supabase.from('audio_job_logs').insert({
      correlation_id: `error-${Date.now()}`,
      level: 'error',
      operation: 'integrity_check_error',
      message: `Nightly integrity check failed: ${error.message}`,
      data: {
        error: error.message,
        stack: error.stack
      },
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      error: error.message,
      correlationId: `error-${Date.now()}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
