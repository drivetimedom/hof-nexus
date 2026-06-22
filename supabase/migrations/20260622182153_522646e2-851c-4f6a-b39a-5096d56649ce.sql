
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'meta-ads-hourly-sync',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--0bb12a49-eed0-406d-a201-0d1ae4784c1e.lovable.app/api/public/meta/sync',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanNiZGh6c2J5c25iZHF3bXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzA1MzEsImV4cCI6MjA5NzYwNjUzMX0.3NpRzq3GSbNX8i2dB5-VTk2QbaeAdfRS7xhC8b2N_JE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
