import { describe, it, expect } from "vitest";

describe("Test envrionment checj", () => {
  it("should use the dedicated test environment", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
