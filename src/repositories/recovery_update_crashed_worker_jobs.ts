import pool from "../db/migrations/pool.js";

export async function updateFailedWorkerJobStatus(
  jobId: string
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const query = `
      UPDATE jobs
      SET job_status = 'standby'
      WHERE id = $1
      AND job_status = 'started'
      RETURNING id;
    `;

    const result = await client.query(query, [jobId]);

    if (result.rowCount !== 1) {
      await client.query("ROLLBACK");
      return false;
    }

    const insertOutboxEvent = `
      INSERT INTO outbox_events (job_id, event_type)
      VALUES ($1, $2);
    `;

    await client.query(insertOutboxEvent, [jobId, "job_recovered"]);

    await client.query("COMMIT");

    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
