//managing PostgreSQL connection using pg
import { Pool } from "pg";
import dotenv from "dotenv";
// import cron from 'node-cron'; //optional: for scheduled heakth check

//load up env variables
dotenv.config();

//PostgreSQL connection
//Utilising environmental variables to keep information secure and adaptable to different environments
const pool = new Pool({
  user: process.env.DATABASE_USERNAME,
  // host:
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env),
});

//Connection pooling is used can be reused multiple times, hence increasing performance -> helps high traffic apps

//Asynchronnou verification to detect errors at the earliest possible stage, minimising downtime and debugging challenges
async function verifyConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release(); //release client back to the pool
  } catch (error) {
    console.log("Error - cannot connect connect to db: ", error);
  }
}

verifyConnection();

export default pool;
