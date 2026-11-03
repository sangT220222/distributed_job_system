import pool from "../db/migrations/pool.js";

type RecoveryResult =
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

    const result = await client.query(
      `UPDATE jobs
       SET job_status = 'standby'
       WHERE id = $1 AND job_status = 'started'
       RETURNING id`,
      [jobId]
    );
    //if the update is success we insert into outbox event table and commit
    if (result.rowCount === 1) {
      await client.query(
        `INSERT INTO outbox_events (job_id, event_type)
         VALUES ($1, $2)`,
        [jobId, "job_recovered"]
      );

      await client.query("COMMIT");
      return { status: "recovered" };
    }

    //if the update fails, inspect existing job status and return. appropriate result
    const jobStatus = await client.query(
      `SELECT job_status FROM jobs WHERE id = $1`,
      [jobId]
    );

    await client.query("ROLLBACK");

    if (jobStatus.rowCount === 0) {
      return { status: "not_found" };
    }

    switch (jobStatus.rows[0].job_status) {
      case "standby":
        return { status: "already_standby" };

      case "completed":
      case "failed":
        return { status: "terminal" };

      default:
        return { status: "unknown" };
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
