//worker to call SQL to retrieve oldest job that's stand_by
//call SQL query to update job_status and finished_at
//polling method to see if next job avaliable
import { emailHandler } from "../handlers/sendEmailHandler.js";
import { retrieveJob } from "../repositories/retrieveJob.js";
import { markJobFinished, markJobStarted } from "../repositories/updateJob.js";

async function startWorker() {
  //polling
  while (true) {
    const job_payload = await retrieveJob();
    if (job_payload === null) {
      //wait for two secs
      console.log("No jobs avaliable. Checking again in 2 seconds");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    const job_id = job_payload.id;
    //update status to started
    await markJobStarted("started", job_id);
    const job_type = job_payload.job_type;
    const job_data = job_payload.job_data;

    try {
      //as we add more handlers, switch case to be used rather that if & else
      if (job_type === "send_email") {
        await emailHandler(job_data);
        //call repo to update the DB for status = completed, finished_at = currentTime
        await markJobFinished("completed", job_id);
      }
      //else if other job_type
      else {
        throw new Error(`Unsupported job type : ${job_type}`);
      }
    } catch (error) {
      //call repo to update the DB for status = failed, finished_at = currentTime
      console.error("Job failed ", error);
      await markJobFinished("failed", job_id);
    }
  }
}

startWorker();
