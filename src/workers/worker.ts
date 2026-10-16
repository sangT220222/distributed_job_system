//worker to call SQL to retrieve oldest job that's stand_by
//call SQL query to update job_status and finished_at
//polling method to see if next job avaliable
import { emailHandler } from "../handlers/sendEmailHandler.js";
import { claimJob } from "../repositories/claimJob.js";
import {
  handleJobFailure,
  markJobFinished,
} from "../repositories/updateJob.js";
import { redisClient } from "../redis.js";

async function startWorker(workerId: string) {
  //polling
  while (true) {
    //implementing Redis queue retrieval

    const jobID = await redisClient.blMove(
      "jobQueue", //source
      "processing", //destination
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
    console.log(`${workerId} claimed ${job_payload.id}`);

    const { job_id, job_type, job_data } = job_payload;

    try {
      //as we add more handlers, switch case to be used rather that if & else
      if (job_type === "send_email") {
        await emailHandler(job_data);
        //call repo to update the DB for status = completed, finished_at = currentTime
        await markJobFinished(job_id);
        console.log(`${workerId} completed ${job_id}`);
      }
      //else if other job_type
      else {
        throw new Error(`Unsupported job type : ${job_type}`);
      }
    } catch (error) {
      //call repo to update the DB for status = failed, finished_at = currentTime
      console.error("Job failed ", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const check = await handleJobFailure(job_id, errorMessage);
      console.log(check);
    }
  }
}

startWorker("worker-1");
startWorker("worker-2");
