import type { RedisClientType } from "redis";

export async function setWorkerTTL(workerID: string, client: RedisClientType) {
  await client.set(`worker:${workerID}:heartbeat`, "alive", {
    EX: 15,
  });
}
