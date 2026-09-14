//here we want to initialise status, job_type, job_data
import { insertJob } from "../repositories/job_repository.js";
import type { JobType } from "../types/job.js";

type InsertJobInput = {
  job_type: JobType;
  job_data: JSON;
};

export async function createJob(parsedData: InsertJobInput) {
  //pass job_type and job_data to SQL
  const payload = {
    job_type: parsedData.job_type,
    job_data: parsedData.job_data,
  };

  const max_retries = getMaxRetries(payload.job_type);

  const result = await insertJob(payload, max_retries);
  return result;
}

function getMaxRetries(job_type: JobType) {
  let max_retries = 0;
  if (job_type === "send_email") {
    max_retries = 3;
  } else if (job_type === "resize_image" || job_type === "send_notification") {
    max_retries = 2;
  }

  return max_retries;
}
