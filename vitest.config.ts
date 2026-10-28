import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", //runs test in Node, instead of browser
    setupFiles: ["./tests/setup.ts"], // execute setup code before each test file
    include: ["tests/**/*.test.ts"], //all the test file that Vitest can find
    fileParallelism: false, //prevent concurrent test files from running - for now
  },
});
