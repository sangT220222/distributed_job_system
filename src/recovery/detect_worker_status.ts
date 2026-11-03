import { redisClient } from "../redis.js";
import { workerRecovery } from "./worker_recovery.js";

export async function detectingWorkerStatus() {
  const workersOnSet = await redisClient.sMembers("workers:registry");
  const expiredWorkers: string[] = [];

  for (let workerID of workersOnSet) {
    const ttl = await redisClient.ttl(`worker:${workerID}:heartbeat`);
    if (ttl === -2) {
      //worker's ttl has expired
      expiredWorkers.push(workerID);
    }
  }
  console.log("Expired workers:", expiredWorkers);

  //pass to recoveryMechanism
  if (expiredWorkers.length > 0) {
    await workerRecovery(expiredWorkers);
  }
}
