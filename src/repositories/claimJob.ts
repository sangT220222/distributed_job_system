import pool from "../db/migrations/pool.js";

// export async function claimJob() {
//   const query = `WITH selected_row AS (
//         SELECT *
//         FROM jobs
//         WHERE job_status = 'standby'
//           AND retry_count <= max_retries
//           AND (
//                 next_retry_at is NULL
//                 OR next_retry_at <= CURRENT_TIMESTAMP
//               )

//         ORDER BY created_at ASC
//         FOR UPDATE SKIP LOCKED
//         LIMIT 1
//     )
//     UPDATE jobs
//     SET job_status = 'started',
//     started_at = CURRENT_TIMESTAMP
//     FROM selected_row
//     WHERE jobs.id = selected_row.id
//     RETURNING *;`;
//   const result = await pool.query(query);
//   return result.rows[0];
// }

export async function claimJob(job_id: string) {
  const query = `
        UPDATE jobs
        SET job_status = 'progressing'
        WHERE id = $1
          AND job_status = 'standby'
        RETURNING id, job_type, job_data
    `;
  const result = await pool.query(query, [job_id]);
  return result.rows[0] ?? null;
}
