import pool from "../db/migrations/pool.js";

export type RecoveryResult =
  | { status: "recovered" }
  | { status: "already_standby" }
  | { status: "terminal" }
  | { status: "not_found" }
  | { status: "unknown" };

export async function updateFailedWorkerJobStatus(
  jobId: string
): Promise<RecoveryResult> {
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
      return { status: "terminal" };
    }

    const insertOutboxEvent = `
      INSERT INTO outbox_events (job_id, event_type)
      VALUES ($1, $2);
    `;

    await client.query(insertOutboxEvent, [jobId, "job_recovered"]);
    await client.query("COMMIT");

    if (result.rowCount === 1) {
      await client.query("ROLLBACK");
      return { status: "recovered" };
    }
    if (result.rowCount === 0) {
      //check
      const queryJobStatus = `
      SELECT job_status
      FROM jobs
      WHERE id = $1
    `;
      const jobStatus = await client.query(queryJobStatus, [jobId]);
      if (jobStatus.rowCount === 0) {
        await client.query("ROLLBACK");
        return { status: "not_found" };
      }

      if (jobStatus.rows[0].job_status === "standby") {
        await client.query("ROLLBACK");
        return { status: "already_standby" };
      }

      if (
        jobStatus.rows[0].job_status === "completed" ||
        jobStatus.rows[0].job_status === "failed"
      ) {
        await client.query("ROLLBACK");
        return { status: "terminal" };
      }
    }
    return { status: "unknown" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
