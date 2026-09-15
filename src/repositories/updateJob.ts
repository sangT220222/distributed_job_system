import pool from "../db/migrations/pool.js";

export async function markJobFinished(id: string) {
  const query =
    "UPDATE jobs SET job_status = 'finished'::status, finished_at = CURRENT_TIMESTAMP WHERE id = $2";
  const values = [id];
  const result = await pool.query(query, values);
  if (result.rowCount === 1) {
  }
  return result;
}

export async function handleJobFailure(id: string, error_message: string) {
  const query = ` 
    UPDATE jobs 
      SET 
        job_status = CASE
          WHEN retry_count < max_retries THEN 'standby'::status
          ELSE 'failed'::status
        END,
        retry_count = CASE
            WHEN retry_count < max_retries THEN retry_count + 1
            ELSE retry_count
        END,

        next_retry_at = CASE
            WHEN retry_count < max_retries
            THEN CURRENT_TIMESTAMP + INTERVAL '5 seconds' * POWER(2, retry_count)
            ELSE NULL
        END,

        finished_at = CASE
            WHEN retry_count < max_retries THEN NULL
            ELSE CURRENT_TIMESTAMP
        END,
        last_error = $2
    WHERE id = $1;
    `;
  const value = [id, error_message];
  const result = await pool.query(query, value);
  if (result.rowCount === 1) {
  }
  return result;
}
