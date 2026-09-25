import app from "./app.js";
// import { publishToRedis } from "./service/publisher.js";

app.listen(process.env.PORT, () => {
  console.log("Listening on PORT " + process.env.PORT);
});

//testing purposes: Publisher and REDIS
// async function main() {
//   await publishToRedis();
// }

// main();
