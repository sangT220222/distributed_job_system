import { ZodType } from "zod";
// import * as z from "zod";
import type { Request, Response, NextFunction } from "express";

export function validateRequestBody<T>(schema: ZodType<T>) {
  return function (req: Request, res: Response, next: NextFunction) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Information passed do not meet the requirements",
      });
    }
    req.body = result.data;
    next();
  };
}
