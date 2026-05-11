import { createClient } from "redis";
import { env } from "./env.js";

let redisClient = null;
let connectPromise = null;

export const redisTtls = {
  availability: 600,
  pricing: 600,
  inventoryLock: 30,
  bookingSession: 900,
  searchCache: 600,
};

export const redisQueues = ["queue:pricing", "queue:email", "queue:inventory", "queue:payment"];

export const buildAvailabilityCacheKey = (hotelId, roomTypeId, date) =>
  `availability:${hotelId}:${roomTypeId}:${date}`;

export const buildPricingCacheKey = (hotelId, roomTypeId, date) =>
  `price:${hotelId}:${roomTypeId}:${date}`;

export const buildInventoryLockKey = (roomTypeId, date) =>
  `lock:inventory:${roomTypeId}:${date}`;

export const buildBookingSessionKey = (userId) => `booking_session:${userId}`;

export const buildSearchCacheKey = (hash) => `search:${hash}`;

const buildRedisOptions = () => {
  if (env.redisUrl) {
    return {
      url: env.redisUrl,
    };
  }

  return {
    username: env.redisUsername,
    password: env.redisPassword || undefined,
    socket: {
      host: env.redisHost,
      port: env.redisPort,
    },
  };
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient(buildRedisOptions());
    redisClient.on("error", (error) => {
      console.error("Redis error:", error.message);
    });
  }

  return redisClient;
};

export const connectRedis = async () => {
  const client = getRedisClient();

  if (client.isOpen) {
    return client;
  }

  if (!connectPromise) {
    connectPromise = client.connect().finally(() => {
      connectPromise = null;
    });
  }

  await connectPromise;
  return client;
};

export const ensureRedisStructure = async () => {
  const client = await connectRedis();

  await client.hSet("schema:redis:pullman_booking:key_patterns", {
    availability: "availability:{hotel_id}:{room_type_id}:{date}",
    pricing: "price:{hotel_id}:{room_type_id}:{date}",
    inventoryLock: "lock:inventory:{room_type_id}:{date}",
    bookingSession: "booking_session:{user_id}",
    searchCache: "search:{cache_hash}",
  });

  await client.hSet("schema:redis:pullman_booking:ttls", {
    availability: String(redisTtls.availability),
    pricing: String(redisTtls.pricing),
    inventoryLock: String(redisTtls.inventoryLock),
    bookingSession: String(redisTtls.bookingSession),
    searchCache: String(redisTtls.searchCache),
  });

  await client.sAdd("schema:redis:pullman_booking:queues", redisQueues);
  await client.set("schema:redis:pullman_booking:status", "ready");

  return {
    keyPatternCount: 5,
    queueCount: redisQueues.length,
  };
};
