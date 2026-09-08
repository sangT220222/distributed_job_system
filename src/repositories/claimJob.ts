import pool from "../db/migrations/pool.js";

export async function claimJob() {
  const query = `WITH selected_row AS (
        SELECT *
        FROM jobs
        WHERE job_status = 'standby'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE jobs
    SET job_status = 'started',
    started_at = CURRENT_TIMESTAMP
    FROM selected_row
    WHERE jobs.id = selected_row.id
    RETURNING *;`;
  const result = await pool.query(query);
  return result.rows[0];
}
