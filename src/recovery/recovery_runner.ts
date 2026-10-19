import { detectingWorkerStatus } from "./detect_worker_status.js";
import { redisClient } from "../redis.js";
async function startRecovery() {
  await redisClient.connect();
  console.log("Recovery component started");
  while (true) {
    try {
      await detectingWorkerStatus();
    } catch (error) {
      console.error("Recovery failed:", error);
    }

    // Wait five seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

startRecovery().catch((error) => {
  console.error("Failed to start recovery component:", error);

  process.exit(1);
});
