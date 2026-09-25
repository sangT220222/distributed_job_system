//publisher is resposible for getting all jobs that doesn't have published_at time stamp
import { getJobsToPublish } from "../repositories/get_unpublished_jobs.js";

export async function publishToRedis() {
  const jobs_to_publish = await getJobsToPublish();
  for (const event of jobs_to_publish) {
    // add event to REDIS
    //if not success, handle error
  }
}

//EG jobs_to_publish:
// [
//   {
//     id: 'a896b0e2-d7d0-4e22-9fee-22c122ea7a23',
//     job_id: '42a7d0a6-0d90-4b40-a3b1-6aba2c27c0f6',
//     event_type: 'job_created',
//     published_at: null,
//     created_at: 2026-09-24T20:15:31.633Z
//   },
//   {
//     id: 'fda537dc-2f36-4092-899c-e3a5403c237d',
//     job_id: '2721f1f7-ba49-4ca6-8ff5-1f57779bec14',
//     event_type: 'job_created',
//     published_at: null,
//     created_at: 2026-09-25T18:23:58.390Z
//   }
// ]
