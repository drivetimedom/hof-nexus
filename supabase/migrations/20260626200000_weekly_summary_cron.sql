-- Resumo semanal por email, toda segunda-feira às 8h (horário de Brasília = 11h UTC)
SELECT cron.schedule(
  'weekly-summary-email',
  '0 11 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://project--0bb12a49-eed0-406d-a201-0d1ae4784c1e.lovable.app/api/public/reports/weekly-summary',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanNiZGh6c2J5c25iZHF3bXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzA1MzEsImV4cCI6MjA5NzYwNjUzMX0.3NpRzq3GSbNX8i2dB5-VTk2QbaeAdfRS7xhC8b2N_JE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
