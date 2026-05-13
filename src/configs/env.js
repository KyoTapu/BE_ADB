import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  appUrl: process.env.URL || process.env.APP_URL || "",
  corsOrigins: String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  postgresUrl:
    process.env.SUPABASE_POOLER_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    "",
  mongoUri: process.env.MONGO_URI || "",
  mongoDbName: process.env.MONGO_DB_NAME || "pullman_booking",
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || "",
  elasticsearchIndex: process.env.ELASTICSEARCH_INDEX || "hotel_room_inventory",
  elasticsearchUsername: process.env.ELASTICSEARCH_USERNAME || "",
  elasticsearchPassword: process.env.ELASTICSEARCH_PASSWORD || "",
  redisUrl: process.env.REDIS_URL || "",
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: toNumber(process.env.REDIS_PORT, 6379),
  redisUsername: process.env.REDIS_USERNAME || "default",
  redisPassword: process.env.REDIS_PASSWORD || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};

export const isProduction = env.nodeEnv === "production";
