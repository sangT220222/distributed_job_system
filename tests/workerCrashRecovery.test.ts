//first scenario - replciate worker being added to Redis queues - registry, and hsving form its own worker queue2

import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { redisClient } from "../src/redis.js";
import { setWorkerTTL } from "../src/workers/set_worker_ttl.js";
import { detectingWorkerStatus } from "../src/recovery/detect_worker_status.js";
import { vi } from "vitest";
import { workerRecovery } from "../src/recovery/worker_recovery.js";

describe("crashed worker scenario", () => {
  const workerID = "TestWorker";
  beforeEach(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.sAdd("workers:registry", workerID);
    await setWorkerTTL(workerID, redisClient);
    //clearing all the mock functions before testing
    vi.clearAllMocks();
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
    expect(workerRecovery).not.toHaveBeenCalled();
  });

  it("expired worker", async () => {
    await redisClient.del(`worker:${workerID}:heartbeat`);
    await detectingWorkerStatus();
    expect(workerRecovery).toHaveBeenCalledWith([workerID]);
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

//mocking a function for testing purposes
vi.mock("../src/recovery/worker_recovery.js", () => ({
  workerRecovery: vi.fn(),
}));
