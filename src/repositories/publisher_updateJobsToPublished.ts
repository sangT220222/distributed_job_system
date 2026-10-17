import pool from "../db/migrations/pool.js";

export async function updateJobsToPublished(id: string) {
  const update_job_to_published = `
            UPDATE outbox_events
            SET published_at = NOW()
            WHERE job_id = $1
                AND published_at IS NULL
        `;
  const result = await pool.query(update_job_to_published, [id]);
  //   console.log("Updated rows:", result.rowCount);
  //   console.log("Updated event:", result.rows[0]);
  return result.rows[0];
}
