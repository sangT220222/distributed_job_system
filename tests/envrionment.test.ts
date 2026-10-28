import { describe, it, expect } from "vitest";
import pool from "../src/db/migrations/pool.js";

describe("Test envrionment checj", () => {
  it("should use the dedicated test environment", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
  it("test database name should be as expected", () => {
    expect(process.env.DATABASE_NAME).toBe("distributed_jobs_test");
  });
  it("connected db should be test", async () => {
    const result = await pool.query("SELECT current_database()");
    expect(result.rows[0].current_database).toBe("distributed_jobs_test");
  });
});
