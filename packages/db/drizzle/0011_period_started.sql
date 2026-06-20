ALTER TABLE "games"
ADD COLUMN "period_started" boolean DEFAULT false NOT NULL;
UPDATE "games"
SET "period_started" = true
WHERE "status" = 'in_progress'
  AND (
    "game_clock_running"
    OR "shot_clock_running"
    OR "game_clock_ms" < CASE
      WHEN "current_period"::text LIKE 'ot%' THEN 300000
      ELSE "quarter_duration_seconds" * 1000
    END
  );
