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
        //recovered statuses:
        switch (recovered.status) {
          case "recovered":
          //job is still in redis queue, but it's either failed or complemted, therefore can clean Redis queues up
          case "terminal":
            // redis queue cleanup
            await redisClient.lRem(`processing-${failedWorker}`, 1, jobId);
            break;

          case "already_standby":
            //check if safe o clean redis up
            break;
          // case { status: "unknown" }:
          //   break;
          case "not_found":
            console.log("Unexpected job id");
            break;
        }
        // terminal
        //recovered
        // already_standby
        // unknown
        // not found
      }
    }
    const remainingJobs = await redisClient.lLen(`processing-${failedWorker}`);
    if (remainingJobs === 0) {
      await redisClient.sRem("workers:registry", failedWorker);
    }
  }
}
