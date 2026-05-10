-- ============================================================
-- pg_cron job: Daily feature status snapshot
--
-- This schedules the snapshot-feature-statuses edge function
-- to run every day at midnight UTC, capturing feature status
-- counts for all products to power the analytics trend charts.
--
-- To set this up:
-- 1. Enable pg_cron via Supabase Dashboard -> Database -> Extensions
-- 2. Enable pg_net for HTTP calls (already enabled by default on Supabase)
-- 3. Run this migration
--
-- Note: pg_cron and pg_net are only available on hosted Supabase (not local Docker).
-- For local development, call the edge function manually.
-- ============================================================

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the cron job — runs at 00:00 UTC daily
-- The edge function URL uses the project's Supabase URL
SELECT cron.schedule(
  'daily-feature-snapshot',  -- job name
  '0 0 * * *',               -- cron expression: midnight daily
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/snapshot-feature-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Alternative: If the above current_setting() doesn't work,
-- you can hardcode your project URL directly (replace with your actual URL):
--
-- SELECT cron.schedule(
--   'daily-feature-snapshot',
--   '0 0 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/snapshot-feature-statuses',
--     headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );

COMMENT ON COLUMN cron.job.jobname IS 'Nightly snapshot of feature status counts for trend analytics';
