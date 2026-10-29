// scenarios
// job fails, retries still remains
// job fails, no retries remaining
// how it handles job id not existing
// failure handling called twice

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import pool from "../src/db/migrations/pool.js";
import { handleJobFailure } from "../src/repositories/updateJob.js";

async function createTestJob(
  retryCount: number,
  maxRetries: number
): Promise<string> {
  const jobInsert = `
        INSERT INTO jobs (job_type, job_data, job_status ,retry_count,max_retries) 
        VALUES ('send_notification',$1,'started',$2,$3)
        RETURNING id;     
      `;
  const result = await pool.query(jobInsert, [
    { data: "test" },
    retryCount,
    maxRetries,
  ]);
  return result.rows[0].id;
}

describe("job failure handle test", () => {
  let test_job_id: string;

  it("retry count = max_retries", async () => {
    test_job_id = await createTestJob(2, 2);
    await handleJobFailure(test_job_id, "retry count exceeds max retries");
    const result = await pool.query(
      `SELECT job_status FROM jobs WHERE id = $1;`,
      [test_job_id]
    );
    expect(result.rows[0].job_status).toBe("failed");
  });

  it("should return job to standby when retries remain", async () => {
    test_job_id = await createTestJob(1, 2);
    const timeBefore = Date.now();
    await handleJobFailure(test_job_id, "Temprorary failure");
    const timeAfter = Date.now();
    const result = await pool.query(`SELECT * FROM jobs WHERE id = $1;`, [
      test_job_id,
    ]);
    expect(result.rows[0].job_status).toBe("standby");
    expect(result.rows[0].retry_count).toBe(2);
    const actualRetryTime = new Date(result.rows[0].next_retry_at).getTime();
    const delay = 5 * Math.pow(2, 1) * 1000;
    const tolerance = 500;
    expect(actualRetryTime).toBeGreaterThanOrEqual(
      timeBefore + delay - tolerance
    );
    expect(actualRetryTime).toBeLessThanOrEqual(timeAfter + delay + tolerance);
  });

  afterEach(async () => {
    if (test_job_id) {
      await pool.query(`DELETE FROM jobs WHERE id = $1`, [test_job_id]);
    }
    test_job_id = "";
  });
});
