import pool from "../db/migrations/pool.js";

export async function updateJobStatus(status: string, id: string) {
  const query =
    "UPDATE jobs SET job_status = ($1), started_at = CURRENT_TIMESTAMP WHERE id = ($2)";
  const values = [status, id];
  const result = await pool.query(query, values);
  if (result.rowCount === 1) {
    console.log("Job status updated");
  }

  return result;
}
