UPDATE jobs
SET retry_count = 0
WHERE retry_count IS NULL;

ALTER TABLE jobs
ALTER COLUMN retry_count SET DEFAULT 0,
ALTER COLUMN retry_count SET NOT NULL;