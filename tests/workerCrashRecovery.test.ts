//first scenario - replciate worker being added to Redis queues - registry, and hsving form its own worker queue2

import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { redisClient } from "../src/redis.js";
import { setWorkerTTL } from "../src/workers/set_worker_ttl.js";
import { detectingWorkerStatus } from "../src/recovery/detect_worker_status.js";

describe("crashed worker scenario", () => {
  const workerID = "TestWorker";
  beforeEach(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.sAdd("workers:registry", workerID);
    await setWorkerTTL(workerID, redisClient);
  });

  it("should not recover a worker with an active heartbeat", async () => {
    const result = await detectingWorkerStatus();
    const ttl = await redisClient.ttl(`worker:${workerID}:heartbeat`);
    const registered = await redisClient.sIsMember(
      "workers:registry",
      workerID
    );
    expect(result).toBeUndefined();
    expect(ttl).toBeGreaterThan(0);
    expect(registered).toBe(1);
  });
  afterEach(async () => {
    //clear test data out
    await redisClient.sRem("workers:registry", workerID);
    await redisClient.del(`worker:${workerID}:heartbeat`);
  });
  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });
});
