//worker to call SQL to retrieve oldest job that's stand_by
//call SQL query to update job_status and finished_at
//polling method to see if next job avaliable

import { emailHandler } from "../handlers/sendEmailHandler.js";
import { retrieveJob } from "../repositories/retrieveJob.js";
import { updateJobStatus } from "../repositories/updateJob.js";

async function startWorker() {
  const job_payload = await retrieveJob();
  if (job_payload === null) {
    return;
  }
  const job_id = job_payload.id;
  //update status to started
  await updateJobStatus("started", job_id);
  //   const job_type = job_payload.job_type;
  //   const job_data = job_payload.job_data;

  //calls the correct handler based on job_type, and execute the right job logic
  // await jobHandler(job_type, job_data);
  //   if (job_type === "send_email") {
  //     emailHandler(job_data);
  //   }
}

startWorker();
