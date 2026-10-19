import { redisClient } from "../redis.js";

export async function detect() {
  const client = await redisClient.connect();
  const workersOnSet = await client.sMembers("workers:registry");
  const expiredWorkers: string[] = [];

  for (let workerID of workersOnSet) {
    const ttl = await redisClient.ttl(`worker:${workerID}:heartbeat`);
    if (ttl === -2) {
      //worker's ttl has expired
      //
      expiredWorkers.push(workerID);
    }
  }
  //pass to recoveryMechanism

  if (expiredWorkers.length > 0) {
    // await recoveryAction(expiredWorkers)
  }
}
