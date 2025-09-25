create extension if not exists "pg_net" with schema "public" version '0.14.0';

create table if not exists "public"."external_api_keys" (
    "id" uuid not null default gen_random_uuid(),
    "key_hash" text not null,
    "label" text,
    "created_by" uuid,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."audio_jobs" alter column "config" drop default;

alter table "public"."audio_jobs" alter column "input_text" drop not null;

alter table "public"."audio_jobs" alter column "processed_chunks" set default 0;

CREATE UNIQUE INDEX IF NOT EXISTS external_api_keys_pkey ON public.external_api_keys USING btree (id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'external_api_keys_pkey') THEN
        alter table "public"."external_api_keys" add constraint "external_api_keys_pkey" PRIMARY KEY using index "external_api_keys_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_post') THEN
        alter table "public"."audio_jobs" add constraint "fk_post" FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE SET NULL not valid;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_post' AND NOT convalidated) THEN
        alter table "public"."audio_jobs" validate constraint "fk_post";
    END IF;
END $$;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only insert into admin_profiles if the new user is meant to be an admin
  -- This assumes there's some way to identify admin users, like a specific email domain
  -- or a flag in the user metadata
  
  -- You might need to adjust this condition based on your application's logic
  IF NEW.email LIKE '%@yourdomain.com' OR 
     (NEW.raw_app_meta_data->>'is_admin')::boolean = true THEN
    
    INSERT INTO public.admin_profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_admin_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.admin_profiles (id, email, role, first_name, last_name)
  SELECT 
    NEW.id,
    NEW.email,
    'admin',
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = NEW.id
  );
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."external_api_keys" to "anon";

grant insert on table "public"."external_api_keys" to "anon";

grant references on table "public"."external_api_keys" to "anon";

grant select on table "public"."external_api_keys" to "anon";

grant trigger on table "public"."external_api_keys" to "anon";

grant truncate on table "public"."external_api_keys" to "anon";

grant update on table "public"."external_api_keys" to "anon";

grant delete on table "public"."external_api_keys" to "authenticated";

grant insert on table "public"."external_api_keys" to "authenticated";

grant references on table "public"."external_api_keys" to "authenticated";

grant select on table "public"."external_api_keys" to "authenticated";

grant trigger on table "public"."external_api_keys" to "authenticated";

grant truncate on table "public"."external_api_keys" to "authenticated";

grant update on table "public"."external_api_keys" to "authenticated";

grant delete on table "public"."external_api_keys" to "service_role";

grant insert on table "public"."external_api_keys" to "service_role";

grant references on table "public"."external_api_keys" to "service_role";

grant select on table "public"."external_api_keys" to "service_role";

grant trigger on table "public"."external_api_keys" to "service_role";

grant truncate on table "public"."external_api_keys" to "service_role";

grant update on table "public"."external_api_keys" to "service_role";

create policy "Allow initial admin creation"
on "public"."admin_profiles"
as permissive
for all
to public
using (true)
with check (true);



