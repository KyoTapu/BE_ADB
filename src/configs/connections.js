import { checkDatabaseConnection } from "./postgres.js";
import { checkMongoConnection, ensureMongoSchema } from "./mongodb.js";
import { connectRedis, ensureRedisStructure } from "./redis.js";

export const connectPlatforms = async () => {
  await checkDatabaseConnection();

  const mongo = await Promise.resolve()
    .then(async () => {
      await checkMongoConnection();
      const collections = await ensureMongoSchema();
      return { ok: true, collections };
    })
    .catch((error) => ({ ok: false, error }));

  const redis = await Promise.resolve()
    .then(async () => {
      await connectRedis();
      const structure = await ensureRedisStructure();
      return { ok: true, structure };
    })
    .catch((error) => ({ ok: false, error }));

  return {
    postgres: { ok: true },
    mongo,
    redis,
  };
};
