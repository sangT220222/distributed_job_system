import app from "./app.js";
import { publishToRedis } from "./service/publisher.js";
import { redisClient } from "./redis.js";

//testing purposes: Publisher and REDIS
async function main() {
  await redisClient.connect();

  app.listen(process.env.PORT, () => {
    console.log("Listening on PORT " + process.env.PORT);
  });

  await publishToRedis();

  await redisClient.quit();
}

main().catch(console.error);
