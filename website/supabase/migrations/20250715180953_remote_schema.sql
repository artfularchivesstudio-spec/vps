create schema if not exists "private";

create table if not exists "private"."worker_config" (
    "key" text not null,
    "value" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX IF NOT EXISTS worker_config_pkey ON private.worker_config USING btree (key);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_config_pkey') THEN
        alter table "private"."worker_config" add constraint "worker_config_pkey" PRIMARY KEY using index "worker_config_pkey";
    END IF;
END $$;


create extension if not exists "pg_net" with schema "public" version '0.14.0';

drop function if exists "public"."update_language_status"(job_id uuid, lang text, new_status text, is_draft_mode boolean);

drop index if exists "public"."idx_audio_jobs_srt_urls";

drop index if exists "public"."idx_audio_jobs_subtitle_urls";

drop index if exists "public"."idx_audio_jobs_vtt_urls";

alter table "public"."audio_jobs" drop column "srt_urls";

alter table "public"."audio_jobs" drop column "subtitle_urls";

alter table "public"."audio_jobs" drop column "vtt_urls";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.setup_audio_worker_cron(api_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Store the API key
    INSERT INTO private.worker_config (key, value)
    VALUES ('chatgpt_actions_key', api_key)
    ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = now();
    
    -- Create the audio processing cron job
    PERFORM cron.schedule(
        'process-audio-jobs',  -- job name
        '* * * * *',          -- run every minute
        'SELECT net.http_post(
            url:=''https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/audio-job-worker-chunked'',
            headers:=json_build_object(
                ''Authorization'', ''chatgpt-ac '' || (SELECT value FROM private.worker_config WHERE key = ''chatgpt_actions_key''),
                ''Content-Type'', ''application/json''
            )::jsonb,
            body:=''{}''::jsonb
        );'
    );
END;
$function$
;


