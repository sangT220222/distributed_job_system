//here we want to initialise status, job_type, job_data
import { insertJob } from "../repositories/job_repository.js";

type InsertJobInput = {
  job_type: string;
  job_data: JSON;
};

export async function createJob(parsedData: InsertJobInput) {
  //pass job_type and job_data to SQL
  const payload = {
    job_type: parsedData.job_type,
    job_data: parsedData.job_data,
  };
  const result = await insertJob(payload);
  return result;
}
