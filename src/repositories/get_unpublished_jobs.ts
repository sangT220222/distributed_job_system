import pool from "../db/migrations/pool.js";

export async function getJobsToPublish() {
  const unpublished_jobs_query = `
            SELECT * 
            FROM outbox_events
            WHERE published_at is NULL
            ORDER BY created_at ASC
        `;
  const result = await pool.query(unpublished_jobs_query);
  return result.rows;
}
