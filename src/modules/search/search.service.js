import { badRequest } from "../../common/errors.js";
import { buildSearchCacheKey, connectRedis } from "../../configs/redis.js";
import { getMongoCollection } from "../../configs/mongodb.js";
import { buildSearchCacheKey as buildSearchHashKey } from "./search.model.js";
import { searchRepository } from "./search.repository.js";

export const searchService = {
  async search(payload = {}) {
    const checkIn = String(payload.checkIn || "").trim();
    const checkOut = String(payload.checkOut || "").trim();

    if (!checkIn || !checkOut) {
      throw badRequest("checkIn and checkOut are required", "MISSING_STAY_DATES");
    }

    const normalizedPayload = {
      hotelId: payload.hotelId || null,
      roomTypeId: payload.roomTypeId || null,
      checkIn,
      checkOut,
      guests: Number(payload.guests) || 1,
    };

    const cacheKey = buildSearchCacheKey(buildSearchHashKey(normalizedPayload));
    let redisClient = null;

    try {
      redisClient = await connectRedis();
      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        return JSON.parse(cachedValue);
      }
    } catch (error) {
      console.warn("Search cache unavailable:", error.message);
    }

    const items = await searchRepository.searchAvailability(normalizedPayload);
    const response = {
      items,
      meta: {
        source: "database",
        cacheKey,
      },
    };

    if (redisClient) {
      await redisClient.set(cacheKey, JSON.stringify(response), {
        EX: 600,
      });
    }

    try {
      const collection = await getMongoCollection("search_logs");
      await collection.insertOne({
        hotel_id: normalizedPayload.hotelId ? String(normalizedPayload.hotelId) : null,
        room_type_id: normalizedPayload.roomTypeId ? String(normalizedPayload.roomTypeId) : null,
        search_date: new Date(),
        checkin_date: normalizedPayload.checkIn,
        checkout_date: normalizedPayload.checkOut,
        guest_count: normalizedPayload.guests,
        searched_room_type: normalizedPayload.roomTypeId ? String(normalizedPayload.roomTypeId) : null,
        created_at: new Date(),
      });
    } catch (error) {
      console.warn("Search log unavailable:", error.message);
    }

    return response;
  },
};
