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
    SET job_status = 'started'
    FROM selected_row
    WHERE jobs.id = selected_row.id
    RETURNING *;`;
  const result = await pool.query(query);
  if (result.rowCount === 1) {
    console.log("Job status updated");
  }
  return result.rows[0];
}
