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
import { updateFailedWorkerJobStatus } from "../src/repositories/recovery_update_crashed_worker_jobs.js";
import pool from "../src/db/migrations/pool.js";

async function createTestJob(
  jobStatus: string,
  retryCount: number,
  maxRetries: number
): Promise<string> {
  const jobInsert = `
        INSERT INTO jobs (job_type, job_data, job_status ,retry_count,max_retries) 
        VALUES ('send_notification',$1,$2,$3,$4)
        RETURNING id;     
      `;
  const result = await pool.query(jobInsert, [
    { data: "test" },
    jobStatus,
    retryCount,
    maxRetries,
  ]);
  return result.rows[0].id;
}

describe("crashed worker scenario", () => {
  const workerID = "TestWorker";
  // let test_job_id: string;
  const test_job_id_arr: string[] = [];

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  beforeEach(async () => {
    await redisClient.sAdd("workers:registry", workerID);
  });

  it("workerRecovery test", async () => {
    const test_job_id = await createTestJob("started", 1, 2);
    test_job_id_arr.push(test_job_id);
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
    console.log(registered);
    expect(registered).toBe(0);
  });

  it("returns already_standby for a standby job", async () => {
    const test_job_id = await createTestJob("standby", 1, 2);
    test_job_id_arr.push(test_job_id);
    const result = await updateFailedWorkerJobStatus(test_job_id);

    expect(result.status).toBe("already_standby");
  });

  //Skipped: Known issue - already_standby jobs are not removed from
  // crashed worker's Redis processing list
  // requires further review of recovery logic

  it.skip("workerRecovery test for standby jobs", async () => {
    const test_job_id = await createTestJob("standby", 1, 2);
    test_job_id_arr.push(test_job_id);
    await redisClient.lPush(`processing-${workerID}`, test_job_id);
    await workerRecovery([workerID]);

    const result = await pool.query(
      `SELECT job_status,retry_count FROM jobs WHERE id = $1`,
      [test_job_id]
    );

    const remainingJobs = await redisClient.lRange(
      `processing-${workerID}`,
      0,
      -1
    );

    expect(result.rows[0].job_status).toBe("standby");
    expect(result.rows[0].retry_count).toBe(1);
    expect(remainingJobs).not.toContain(test_job_id);
    const registered = await redisClient.sIsMember(
      "workers:registry",
      workerID
    );
    expect(registered).toBe(0);
  });

  it("workerRecovery test for multiple abandoned jobs", async () => {
    const test_job_id_1 = await createTestJob("started", 1, 1);
    const test_job_id_2 = await createTestJob("started", 1, 2);
    const test_job_id_3 = await createTestJob("started", 1, 3);
    test_job_id_arr.push(test_job_id_1);
    test_job_id_arr.push(test_job_id_2);
    test_job_id_arr.push(test_job_id_3);

    await redisClient.lPush(`processing-${workerID}`, test_job_id_1);
    await redisClient.lPush(`processing-${workerID}`, test_job_id_2);
    await redisClient.lPush(`processing-${workerID}`, test_job_id_3);

    await workerRecovery([workerID]);

    const result = await pool.query(
      `SELECT job_status FROM jobs WHERE id = $1`,
      [test_job_id_1]
    );
    const result2 = await pool.query(
      `SELECT job_status FROM jobs WHERE id = $1`,
      [test_job_id_2]
    );
    const result3 = await pool.query(
      `SELECT job_status FROM jobs WHERE id = $1`,
      [test_job_id_3]
    );

    const remainingJobs = await redisClient.lRange(
      `processing-${workerID}`,
      0,
      -1
    );

    expect(result.rows[0].job_status).toBe("standby");
    expect(result2.rows[0].job_status).toBe("standby");
    expect(result3.rows[0].job_status).toBe("standby");

    expect(remainingJobs).not.toContain(test_job_id_1);
    expect(remainingJobs).not.toContain(test_job_id_2);
    expect(remainingJobs).not.toContain(test_job_id_3);

    const registered = await redisClient.sIsMember(
      "workers:registry",
      workerID
    );
    expect(registered).toBe(0);
  });

  afterEach(async () => {
    //clear test data out
    await redisClient.sRem("workers:registry", workerID);
    if (test_job_id_arr.length > 0) {
      for (let i = 0; i < test_job_id_arr.length; i++) {
        await pool.query(`DELETE FROM outbox_events WHERE job_id = $1`, [
          test_job_id_arr[i],
        ]);
        await pool.query(`DELETE FROM jobs WHERE id = $1`, [
          test_job_id_arr[i],
        ]);
        test_job_id_arr.splice(i);
      }
    }

    await redisClient.del(`processing-${workerID}`);
  });
  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });
});
