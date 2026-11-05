// Focus on two scenarios:
// - An unpublished outbox event results in its job ID being added to jobQueue and its published state being updated.
// - Running the publisher again does not publish that same event a second time, assuming the first run completed successfully.

import { describe, it, expect, afterEach, afterAll, beforeAll } from "vitest";
import pool from "../src/db/migrations/pool.js";
import { redisClient } from "../src/redis.js";
import { publishToRedis } from "../src/service/publisher.js";
import { workerRecovery } from "../src/recovery/worker_recovery.js";

import { randomUUID } from "node:crypto";

describe("abandoned job recovery", () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  it("returns an abandoned job to the queue", async () => {
    const jobId = randomUUID();
    const abandonedWorkerId = `test-abandoned-${randomUUID()}`;
    const processingKey = `processing-${abandonedWorkerId}`;
    try {
      await pool.query(
        `INSERT INTO jobs (
            id, job_type, job_status, job_data,
            started_at, retry_count, max_retries
        )
        VALUES ($1, 'send_email', 'started', $2::jsonb, NOW(), 0, 3)`,
        [
          jobId,
          JSON.stringify({
            email_address: "test@example.com",
            email_content: "Recovery integration test",
          }),
        ]
      );

      await redisClient.lPush(processingKey, jobId);
      await redisClient.sAdd("workers:registry", abandonedWorkerId);
      await redisClient.del(`worker:${abandonedWorkerId}:heartbeat`);

      await workerRecovery([abandonedWorkerId]);
      const result = await pool.query(
        "SELECT job_status FROM jobs WHERE id = $1",
        [jobId]
      );

      expect(result.rows[0].job_status).toBe("standby");

      expect(await redisClient.lRange(processingKey, 0, -1)).not.toContain(
        jobId
      );

      expect(
        await redisClient.sIsMember("workers:registry", abandonedWorkerId)
      ).toBe(0);

      await publishToRedis();

      expect(await redisClient.lRange("jobQueue", 0, -1)).toContain(jobId);
    } finally {
      await redisClient.lRem("jobQueue", 0, jobId);
      await redisClient.del(processingKey);
      await redisClient.del(`worker:${abandonedWorkerId}:heartbeat`);
      await redisClient.sRem("workers:registry", abandonedWorkerId);

      await pool.query("DELETE FROM outbox_events WHERE job_id = $1", [jobId]);
      await pool.query("DELETE FROM jobs WHERE id = $1", [jobId]);
    }
  });
});
