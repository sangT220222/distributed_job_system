import { describe, it, expect, beforeEach, afterEach } from "vitest";
import pool from "../src/db/migrations/pool.js";
import { claimJob } from "../src/repositories/claimJob.js";
import { randomUUID } from "node:crypto";

describe("claim job test", () => {
  let test_job_id: string;
  beforeEach(async () => {
    const jobInsert = `
        INSERT INTO jobs (job_type, job_data,max_retries) 
        VALUES ('send_notification',$1,3)
        RETURNING id;     
      `;
    const values = [
      {
        data: "test",
      },
    ];
    const result = await pool.query(jobInsert, values);
    test_job_id = result.rows[0].id;
  });
  it("should claim a standby job by ID", async () => {
    const result = await claimJob(test_job_id);
    expect(result?.id).toBe(test_job_id);
  });
  it("should return job_status from standyby to started", async () => {
    await claimJob(test_job_id);
    const queryJobStatus = `
        SELECT job_status
        FROM jobs
        WHERE id = $1
    `;
    const result = await pool.query(queryJobStatus, [test_job_id]);
    expect(result.rows[0].job_status).toBe("started");
  });
  it("should prevent claiming an already claimed job", async () => {
    const successClaim = await claimJob(test_job_id);
    const dupeClaim = await claimJob(test_job_id);
    expect(successClaim?.id).toBe(test_job_id);
    expect(dupeClaim).toBeNull();
  });
  it("should provide null for a uuid that's not in the database", async () => {
    const nonExistingUUID = randomUUID();
    const jobClaim = await claimJob(nonExistingUUID);
    expect(jobClaim).toBeNull();
  });
  afterEach(async () => {
    //clear test data out
    const removeTestData = `
        DELETE FROM jobs
        WHERE id = $1
    `;
    await pool.query(removeTestData, [test_job_id]);
  });
});
