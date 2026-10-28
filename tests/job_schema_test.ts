import { job_request_schema_v2 } from "../validation/job.schema.js";

const testData = {
  job_type: "send_email",
  job_data: { email_address: "test@gmail.com", email_content: "TESTING HERE" },
};

const testDataFail = {
  job_type: "send_email",
  job_data: { email_address: "testm", email_content: "TESTING HERE" },
};

const testDataFail2 = {
  job_type: "send_email_fail",
  job_data: { email_address: "test@gmail.com", email_content: "TESTING HERE" },
};

const testResult = job_request_schema_v2.safeParse(testDataFail2);

console.log(testResult);
