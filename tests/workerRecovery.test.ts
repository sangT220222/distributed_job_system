//first scenario - replciate worker being added to Redis queues - registry, and hsving form its own worker queue2

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
} from "vitest";
import { redisClient } from "../src/redis.js";
import { workerRecovery } from "../src/recovery/worker_recovery.js";
import pool from "../src/db/migrations/pool.js";

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

describe("crashed worker scenario", () => {
  const workerID = "TestWorker";
  let test_job_id: string;

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  beforeEach(async () => {
    await redisClient.sAdd("workers:registry", workerID);
  });

  it("workerRecovery test", async () => {
    test_job_id = await createTestJob(1, 2);
    await redisClient.lPush(`processing-${workerID}`, test_job_id);
    await workerRecovery([workerID]);

    const result = await pool.query(
      `SELECT job_status FROM jobs WHERE id = $1`,
      [test_job_id]
    );

    expect(result.rows[0].job_status).toBe("standby");
    const remainingJobs = await redisClient.lRange(
      `processing-${workerID}`,
      0,
      -1
    );

    expect(remainingJobs).not.toContain(test_job_id);
    const registered = await redisClient.sIsMember(
      "workers:registry",
      workerID
    );

    expect(registered).toBe(0);
  });
  afterEach(async () => {
    //clear test data out
    await redisClient.sRem("workers:registry", workerID);
    if (test_job_id) {
      await pool.query(`DELETE FROM outbox_events WHERE job_id = $1`, [
        test_job_id,
      ]);
      //del parent recordr later due to child record - outbox_evennts referencing it
      await pool.query(`DELETE FROM jobs WHERE id = $1`, [test_job_id]);
    }
    test_job_id = "";
    await redisClient.del(`processing-${workerID}`);
  });
  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });
});
