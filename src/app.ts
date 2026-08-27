// Setting up Express application
import express from "express";
import dotenv from "dotenv";
import { router } from "./routes/job_route.js";

export const app = express();
dotenv.config();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TS API running" });
});

app.use("/check", router);

export default app;
