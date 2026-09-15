ALTER TABLE jobs
ADD retry_count INT NULL,
ADD max_retries INT NULL,
ADD next_retry_at TIMESTAMP NULL,
ADD last_error VARCHAR(255);
