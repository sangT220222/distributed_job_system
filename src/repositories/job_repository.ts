import pool from "../db/migrations/pool.js";

type InsertJobInput = {
  job_type: string;
  job_data: JSON;
};

export async function insertJob(payload: InsertJobInput, max_retries: number) {
  const insertJob =
    "INSERT INTO jobs (job_type, job_data,max_retries) VALUES ($1,$2,$3) RETURNING *";
  const values = [payload.job_type, payload.job_data, max_retries];
  const result = await pool.query(insertJob, values);
  return result;
}
