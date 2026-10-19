//worker to call SQL to retrieve oldest job that's stand_by
//call SQL query to update job_status and finished_at
//polling method to see if next job avaliable
import { emailHandler } from "../handlers/sendEmailHandler.js";
import { claimJob } from "../repositories/claimJob.js";
import { setWorkerTTL } from "./set_worker_ttl.js";
import {
  handleJobFailure,
  markJobFinished,
} from "../repositories/updateJob.js";
import { redisClient } from "../redis.js";

async function startWorker(workerId: string) {
  //with seperate connections, workers are able to wait independently for work,
  // allowing them to process jobs concurrently
  const workerRedis = redisClient.duplicate();
  const heartbeatRedis = redisClient.duplicate();
  await workerRedis.connect();
  await heartbeatRedis.connect();
  //add workerId to Redis registry/map for recovery component to refer to
  await workerRedis.sAdd("workers:registry", workerId);

  //heartbeat implementation for worker failure detection
  setInterval(() => {
    setWorkerTTL(workerId, heartbeatRedis).catch((error) => {
      console.error(`[${workerId}] Heartbeat failed:`, error);
    }); //as setWorkerTTL() is async, we want to handle failure
  }, 5000);

  while (true) {
    //implementing Redis queue retrieval
    const jobID = await workerRedis.blMove(
      "jobQueue", //source
      `processing-${workerId}`, //destination
      "RIGHT", // as we use lpush when we push unpublished jobs, we do right to retrieve the oldest items
      "LEFT", //insert at left for destination
      0 //timeout second - this means the worker waits indefinitely if jobQueue is empty.
    );

    console.log(`${jobID} claimed`);
    if (!jobID) {
      console.log(`Job: ${jobID} can not be claimed`);
      continue;
    }
    //get payload from SQL
    const job_payload = await claimJob(jobID);

    if (!job_payload) {
      console.log(`${workerId}: Job ${jobID} could not be claimed`);
      continue;
    }

    const { id, job_type, job_data } = job_payload;
    console.log(`${workerId} claimed ${id}`);

    let handlerError: unknown = null;

    try {
      if (job_type === "send_email") {
        await emailHandler(job_data);
      } else {
        throw new Error(`Unsupported job type: ${job_type}`);
      }
    } catch (error) {
      handlerError = error;
    }

    if (handlerError === null) {
      await markJobFinished(id);
      console.log(`${workerId} completed ${id}`);
    } else {
      const errorMessage =
        handlerError instanceof Error
          ? handlerError.message
          : String(handlerError);

      await handleJobFailure(id, errorMessage);
    }
    console.log(`[${workerId}] About to acknowledge ${jobID}`);

    const removed = await workerRedis.lRem(`processing-${workerId}`, -1, jobID);

    console.log(`[${workerId}] Acknowledged ${jobID}. Removed: ${removed}`);
  }
}

startWorker("worker-1");
startWorker("worker-2");
startWorker("worker-3");
