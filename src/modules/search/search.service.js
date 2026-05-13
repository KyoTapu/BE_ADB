import { badRequest } from "../../common/errors.js";
import { elasticsearchClient } from "../../configs/elasticsearch.js";
import { buildSearchCacheKey, connectRedis } from "../../configs/redis.js";
import { getMongoCollection } from "../../configs/mongodb.js";
import { buildSearchCacheKey as buildSearchHashKey } from "./search.model.js";
import { searchRepository } from "./search.repository.js";

const normalizeTextFilter = (value) => String(value || "").trim();
const isActiveFilter = (value) => value && value !== "Tất cả";

const buildElasticsearchQuery = (payload) => {
  const keyword = normalizeTextFilter(payload.search);
  const destination = normalizeTextFilter(payload.destination);
  const roomTypeName = normalizeTextFilter(payload.roomType);
  const amenity = normalizeTextFilter(payload.amenity);
  const service = normalizeTextFilter(payload.service);
  const must = [];
  const filter = [];

  if (keyword) {
    must.push({
      multi_match: {
        query: keyword,
        fields: [
          "hotelName^4",
          "roomTypeName^3",
          "city^2",
          "country",
          "description",
          "amenitiesText",
          "servicesText",
          "bedType",
        ],
        fuzziness: "AUTO",
        operator: "and",
      },
    });
  }

  if (isActiveFilter(destination)) {
    filter.push({
      term: {
        "city.keyword": destination,
      },
    });
  }

  if (isActiveFilter(roomTypeName)) {
    filter.push({
      term: {
        "roomTypeName.keyword": roomTypeName,
      },
    });
  }

  if (isActiveFilter(amenity)) {
    filter.push({
      term: {
        amenities: amenity,
      },
    });
  }

  if (isActiveFilter(service)) {
    filter.push({
      term: {
        services: service,
      },
    });
  }

  if (payload.stars) {
    filter.push({
      range: {
        starRating: {
          gte: Number(payload.stars) || 0,
        },
      },
    });
  }

  if (payload.minPrice || payload.maxPrice) {
    filter.push({
      range: {
        basePrice: {
          ...(payload.minPrice ? { gte: Number(payload.minPrice) || 0 } : {}),
          ...(payload.maxPrice ? { lte: Number(payload.maxPrice) || 0 } : {}),
        },
      },
    });
  }

  return {
    size: 200,
    _source: ["hotelId", "roomTypeId"],
    query: {
      bool: {
        must,
        filter,
      },
    },
  };
};

const shouldUseElasticsearch = (payload) =>
  Boolean(
    normalizeTextFilter(payload.search) ||
      isActiveFilter(payload.destination) ||
      isActiveFilter(payload.roomType) ||
      isActiveFilter(payload.amenity) ||
      isActiveFilter(payload.service) ||
      payload.stars ||
      payload.minPrice ||
      payload.maxPrice,
  );

const resolveElasticsearchCandidates = async (payload) => {
  if (!elasticsearchClient.isConfigured() || !shouldUseElasticsearch(payload)) {
    return {
      enabled: elasticsearchClient.isConfigured(),
      used: false,
      candidateHotelIds: [],
      candidateRoomTypeIds: [],
    };
  }

  const response = await elasticsearchClient.search(buildElasticsearchQuery(payload));
  const hits = Array.isArray(response?.hits?.hits) ? response.hits.hits : [];
  const candidateHotelIds = [...new Set(hits.map((hit) => String(hit?._source?.hotelId || "")).filter(Boolean))];
  const candidateRoomTypeIds = [
    ...new Set(hits.map((hit) => String(hit?._source?.roomTypeId || "")).filter(Boolean)),
  ];

  return {
    enabled: true,
    used: true,
    candidateHotelIds,
    candidateRoomTypeIds,
  };
};

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
      search: normalizeTextFilter(payload.search),
      destination: normalizeTextFilter(payload.destination),
      roomType: normalizeTextFilter(payload.roomType),
      amenity: normalizeTextFilter(payload.amenity),
      service: normalizeTextFilter(payload.service),
      minPrice: normalizeTextFilter(payload.minPrice),
      maxPrice: normalizeTextFilter(payload.maxPrice),
      stars: normalizeTextFilter(payload.stars),
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

    let elasticsearchMeta = {
      enabled: elasticsearchClient.isConfigured(),
      used: false,
      fallback: false,
      candidateCount: 0,
    };
    let candidateHotelIds = [];
    let candidateRoomTypeIds = [];

    try {
      const candidates = await resolveElasticsearchCandidates(normalizedPayload);
      candidateHotelIds = candidates.candidateHotelIds;
      candidateRoomTypeIds = candidates.candidateRoomTypeIds;
      elasticsearchMeta = {
        ...elasticsearchMeta,
        enabled: candidates.enabled,
        used: candidates.used,
        candidateCount: candidateRoomTypeIds.length,
      };
    } catch (error) {
      elasticsearchMeta = {
        ...elasticsearchMeta,
        used: false,
        fallback: true,
        error: error.message,
      };
      console.warn("Elasticsearch search unavailable, falling back to PostgreSQL:", error.message);
    }

    if (elasticsearchMeta.used && !candidateRoomTypeIds.length && !candidateHotelIds.length) {
      elasticsearchMeta = {
        ...elasticsearchMeta,
        used: false,
        fallback: true,
        fallbackReason: "no_candidates",
      };
    }

    const items = await searchRepository.searchAvailability({
      ...normalizedPayload,
      candidateHotelIds,
      candidateRoomTypeIds,
    });
    const response = {
      items,
      meta: {
        source: elasticsearchMeta.used ? "elasticsearch+database" : "database",
        cacheKey,
        elasticsearch: elasticsearchMeta,
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
