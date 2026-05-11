import {
  ensureRedisStructure,
  getRedisClient,
  redisQueues,
} from "../src/configs/redis.js";

const run = async () => {
  const result = await ensureRedisStructure();
  const client = getRedisClient();
  const patterns = await client.hGetAll("schema:redis:pullman_booking:key_patterns");
  const ttls = await client.hGetAll("schema:redis:pullman_booking:ttls");
  const queues = await client.sMembers("schema:redis:pullman_booking:queues");
  const status = await client.get("schema:redis:pullman_booking:status");

  console.log(
    JSON.stringify(
      {
        result,
        status,
        patterns,
        ttls,
        queues,
        expectedQueues: redisQueues,
      },
      null,
      2,
    ),
  );

  await client.quit();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
