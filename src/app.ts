// Setting up Express application
import express from "express";
import dotenv from "dotenv";

export const app = express();
dotenv.config();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TS API running" });
});

export default app;
