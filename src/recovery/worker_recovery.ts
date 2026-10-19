import { redisClient } from "../redis.js";
import { updateFailedWorkerJobStatus } from "../repositories/recovery_update_crashed_worker_jobs.js";

export async function workerRecovery(expiredWorkersList: string[]) {
  for (let failedWorker of expiredWorkersList) {
    const failedJobsList = await redisClient.lRange(
      `processing-${failedWorker}`,
      0,
      -1
    ); //0 : starting index, -1: retrieve through the last element
    //get the job and push it back
    //[jobId,jobId2]
    console.log(`Recovering ${failedWorker}:`, failedJobsList);
    while (failedJobsList.length > 0) {
      const jobId = failedJobsList.pop();
      //update PostgreSQL - jobs and outbox_event tables
      if (jobId) {
        const recovered = await updateFailedWorkerJobStatus(jobId);
        console.log(`Job ${jobId} recovered:`, recovered);

        if (recovered) {
          await redisClient.lRem(`processing-${failedWorker}`, 1, jobId);
          await redisClient.sRem("workers:registry", failedWorker);
        }
      }
    }
  }
}
