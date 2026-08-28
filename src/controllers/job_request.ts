import type { Request, Response } from "express";
import { createJob } from "../service/job_service.js";

export async function jobRequestController(req: Request, res: Response) {
  try {
    const result = await createJob(req.body); // calling business logic function, passing the parsed data
    return res
      .status(201)
      .json({ success: true, message: "Job created", data: result.rows[0] });
    //rows[0] return the newly inserted row we did in createJob
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "ERROR",
    });
  }
}
