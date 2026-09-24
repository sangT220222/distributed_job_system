import pool from "../db/migrations/pool.js";

type InsertJobInput = {
  job_type: string;
  job_data: JSON;
};

export async function insertJob(payload: InsertJobInput, max_retries: number) {
  const insertJob = `
      WITH insert_jobs AS (
        INSERT INTO jobs (job_type, job_data,max_retries) 
        VALUES ($1,$2,$3) 
        RETURNING *
        )
        ,insert_outbox AS (
          INSERT INTO outbox_events (job_id)  
          SELECT id 
          FROM insert_jobs
        )
        SELECT * 
        FROM insert_jobs;
      `;
  const values = [payload.job_type, payload.job_data, max_retries];
  const result = await pool.query(insertJob, values);
  return result;
}
