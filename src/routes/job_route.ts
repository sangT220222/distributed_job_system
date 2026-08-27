import { Router } from "express";
import { job_request_schema_v2 } from "../validation/job.schema.js";
import { validateRequestBody } from "../middleware/requestValidation.js";

export const router = Router();

router.post(
  "/jobPost",
  //validating input with zod
  validateRequestBody(job_request_schema_v2),
  //controller to read parsed request data and call business logci function
  //business logic - apply custom logic to data so that we can have payload ready for SQL
  //writing to sql
  (req, res) => {
    res.status(200).json({
      message: "Validation passed",
      data: req.body,
    });
  }
);
