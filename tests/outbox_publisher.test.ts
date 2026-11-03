// Focus on two scenarios:
// - An unpublished outbox event results in its job ID being added to jobQueue and its published state being updated.
// - Running the publisher again does not publish that same event a second time, assuming the first run completed successfully.

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
} from "vitest";
import pool from "../src/db/migrations/pool.js";
import { redisClient } from "../src/redis.js";
import { publishToRedis } from "../src/service/publisher.js";

async function createTestJob(
  jobStatus: string,
  retryCount: number,
  maxRetries: number
): Promise<string> {
  const jobInsert = `
        WITH insert_jobs AS (
        INSERT INTO jobs (job_type, job_data, job_status ,retry_count,max_retries) 
        VALUES ('send_notification',$1,$2,$3,$4)
        RETURNING id
        )
        ,insert_outbox AS (
          INSERT INTO outbox_events (job_id)  
          SELECT id 
          FROM insert_jobs
          RETURNING id
        )
        SELECT * 
        FROM insert_jobs;
      `;
  const result = await pool.query(jobInsert, [
    { data: "test" },
    jobStatus,
    retryCount,
    maxRetries,
  ]);
  return result.rows[0].id;
}

describe("outbox publisher test", () => {
  let test_job_id: string;

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  it("unpublished outbox event's id being added to jobQueue", async () => {
    test_job_id = await createTestJob("standby", 1, 3);
    const new_job_status = await pool.query(
      `SELECT event_type FROM outbox_events WHERE job_id = $1`,
      [test_job_id]
    );
    expect(new_job_status.rows[0].event_type).toBe("job_created");
    await publishToRedis();
    const queuedJobs = await redisClient.lRange("jobQueue", 0, -1);
    expect(queuedJobs).toContain(test_job_id);
    const query = `SELECT published_at from outbox_events WHERE job_id = $1;`;
    const result = await pool.query(query, [test_job_id]);
    expect(result.rows[0].published_at).not.toBeNull();
  });
  it("st test", async () => {
    test_job_id = await createTestJob("standby", 1, 5);
    const new_job_status = await pool.query(
      `SELECT event_type FROM outbox_events WHERE job_id = $1`,
      [test_job_id]
    );
    expect(new_job_status.rows[0].event_type).toBe("job_created");
    //publishToRedis() calls getJobsToPublish() which will get older jobs (test data) published. jobQueue needs to be cleared
    await publishToRedis();
    await publishToRedis();
    const queuedJobs = await redisClient.lRange("jobQueue", 0, -1);
    expect(queuedJobs.filter((jobId) => jobId === test_job_id).length).toBe(1);
    const query = `SELECT published_at from outbox_events WHERE job_id = $1;`;
    const result = await pool.query(query, [test_job_id]);
    expect(result.rows[0].published_at).not.toBeNull();
  });
  afterEach(async () => {
    //clear test data out
    await pool.query(`DELETE FROM outbox_events WHERE job_id = $1`, [
      test_job_id,
    ]);
    await pool.query(`DELETE FROM jobs WHERE id = $1`, [test_job_id]);
    await redisClient.lRem("jobQueue", 0, test_job_id); //0 to remove all occurences with matching job ID
  });
  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });
});
