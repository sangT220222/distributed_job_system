import pool from "../db/migrations/pool.js";

export async function retrieveJob() {
  const query =
    "SELECT * FROM jobs WHERE job_status = 'standby' ORDER BY created_at ASC LIMIT 1";
  const result = await pool.query(query);
  return result.rows[0] !== undefined ? result.rows[0] : null;
}
