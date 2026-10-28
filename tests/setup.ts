import { config } from "dotenv";

config({
  path: ".env.test",
  override: true, //overrids the existing default .env variables
});

if (process.env.NODE_ENV !== "test") {
  throw new Error("Tests must run in the test environment");
}
