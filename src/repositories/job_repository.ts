import pool from "../db/migrations/pool.js";

type InsertJobInput = {
  job_type: string;
  job_data: JSON;
};

export async function insertJob(payload: InsertJobInput) {
  const insertJob =
    "INSERT INTO jobs (job_type, job_data) VALUES ($1,$2) RETURNING *";
  const values = [payload.job_type, payload.job_data];
  const result = await pool.query(insertJob, values);
  return result;
}
