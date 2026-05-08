import { elasticsearchClient } from "../../../common/elasticsearch.js";
import { generateStayDates } from "../booking/booking.pricing.js";
import { toHotelSummaryListResponse } from "../hotels/hotels.model.js";
import { roomInventorySnapshotService } from "./roomInventorySnapshot.service.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const parseGuests = (rawValue) => {
  const matched = String(rawValue || "").match(/\d+/);
  return Math.max(Number(matched?.[0]) || 1, 1);
};

class SearchService {
  async getIndexStatus() {
    const [elasticsearchStatus, snapshotStatus] = await Promise.all([
      elasticsearchClient.getStatus().catch((error) => ({
        configured: false,
        exists: false,
        documentCount: 0,
        clusterHealth: "error",
        error: error.message,
      })),
      roomInventorySnapshotService.getStatus().catch((error) => ({
        collectionName: "room_inventory_daily",
        documentCount: 0,
        dateFrom: null,
        dateTo: null,
        error: error.message,
      })),
    ]);

    return {
      elasticsearch: elasticsearchStatus,
      snapshot: snapshotStatus,
    };
  }

  async rebuildIndex({ horizonDays = 180 } = {}) {
    const sync = await roomInventorySnapshotService.syncFromPostgres({ horizonDays });
    const snapshotDocuments = await roomInventorySnapshotService.listDocuments({ limit: 300000 });
    const elasticDocuments = snapshotDocuments.map((document) => ({
      id: String(document._id),
      roomTypeId: document.roomTypeId,
      hotelId: document.hotelId,
      hotelName: document.hotelName,
      roomTypeName: document.roomTypeName,
      cityAddress: document.cityAddress,
      countryName: document.countryName,
      countryCode: document.countryCode,
      description: document.description,
      servicesText: document.servicesText,
      snapshotDate: document.snapshotDate,
      availableDate: document.snapshotDate,
      price: Number(document.pricing?.price70) || 0,
      basePrice: Number(document.pricing?.basePrice) || 0,
      capacity: Number(document.capacity) || 0,
      rating: Number(document.rating) || 0,
      totalRooms: Number(document.inventory?.totalRooms ?? document.totalRooms) || 0,
      bookedRooms: Number(document.inventory?.bookedRooms ?? document.bookedRooms) || 0,
      availableRoomCount:
        Number(document.inventory?.availableRoomCount ?? document.availableRoomCount) || 0,
      amenities: document.amenities || [],
      services: document.serviceNames || (document.services || []).map((service) => service.name).filter(Boolean),
      serviceCatalog: document.services || document.serviceCatalog || [],
      searchTags: document.searchTags || [],
      location: document.location || { lat: null, lon: null },
      source: document.source || {},
      indexedAt: new Date().toISOString(),
    }));

    const indexing = await elasticsearchClient.replaceIndex(elasticDocuments);

    return {
      sync,
      elasticsearch: indexing,
      horizonDays,
      indexName: elasticsearchClient.getIndexName(),
    };
  }

  async searchHotels(query = {}) {
    const searchText = String(query.search || query.destination || "").trim();
    const roomType = String(query.roomType || "").trim();
    const amenity = String(query.amenity || "").trim();
    const service = String(query.service || "").trim();
    const checkIn = String(query.checkIn || query.check_in || "").trim();
    const checkOut = String(query.checkOut || query.check_out || "").trim();
    const stars = String(query.stars || "").trim();
    const minPrice = Number(query.minPrice ?? query.min_price);
    const maxPrice = Number(query.maxPrice ?? query.max_price);
    const guests = parseGuests(query.guests);
    const sortBy = String(query.sortBy || query.sort_by || "price_asc").trim();

    if (!checkIn || !checkOut) {
      throw createError("checkIn and checkOut are required", 400, "MISSING_STAY_DATES");
    }

    const stayDates = generateStayDates(checkIn, checkOut);
    if (!stayDates.length) {
      throw createError("checkOut must be after checkIn", 400, "INVALID_STAY_DATES");
    }

    if (!elasticsearchClient.isConfigured()) {
      throw createError("Elasticsearch is not configured", 503, "ELASTICSEARCH_NOT_CONFIGURED");
    }

    const must = [
      {
        terms: {
          availableDate: stayDates,
        },
      },
      {
        range: {
          capacity: {
            gte: guests,
          },
        },
      },
      {
        range: {
          availableRoomCount: {
            gte: 1,
          },
        },
      },
    ];

    if (searchText && searchText !== "Tất cả") {
      must.push({
        multi_match: {
          query: searchText,
          fields: ["hotelName^3", "cityAddress^2", "countryName", "roomTypeName"],
        },
      });
    }

    if (roomType && roomType !== "Tất cả") {
      must.push({
        term: {
          "roomTypeName.keyword": roomType,
        },
      });
    }

    if (amenity && amenity !== "Tất cả") {
      must.push({
        term: {
          amenities: amenity,
        },
      });
    }

    if (service && service !== "Tất cả") {
      must.push({
        term: {
          services: service,
        },
      });
    }

    if (Number.isFinite(minPrice) && minPrice > 0) {
      must.push({
        range: {
          price: {
            gte: minPrice,
          },
        },
      });
    }

    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      must.push({
        range: {
          price: {
            lte: maxPrice,
          },
        },
      });
    }

    if (stars) {
      must.push({
        range: {
          rating: {
            gte: Number(stars),
          },
        },
      });
    }

    const response = await elasticsearchClient.search({
      size: 10000,
      query: {
        bool: {
          must,
        },
      },
    });

    const hits = Array.isArray(response?.hits?.hits) ? response.hits.hits : [];
    const grouped = new Map();

    for (const hit of hits) {
      const document = hit._source || {};
      const key = String(document.roomTypeId);
      const current = grouped.get(key) || [];
      current.push(document);
      grouped.set(key, current);
    }

    const matchedRoomTypes = [];

    for (const documents of grouped.values()) {
      const dateMap = new Map(documents.map((document) => [document.availableDate, document]));
      const orderedDocuments = stayDates.map((date) => dateMap.get(date)).filter(Boolean);

      if (orderedDocuments.length !== stayDates.length) {
        continue;
      }

      const first = orderedDocuments[0];
      const stayTotal = orderedDocuments.reduce((sum, document) => sum + (Number(document.price) || 0), 0);
      const averageNightlyRate = orderedDocuments.length
        ? Math.round(stayTotal / orderedDocuments.length)
        : Number(first.price) || 0;

      matchedRoomTypes.push({
        hotel_id: first.hotelId,
        room_type_id: first.roomTypeId,
        room_type_name: first.roomTypeName,
        room_type_base_price: first.basePrice,
        room_type_services: first.servicesText,
        amenities: (first.amenities || []).map((name, index) => ({
          amenity_name: name,
          amenity_id: index + 1,
        })),
        services: Array.isArray(first.serviceCatalog)
          ? first.serviceCatalog.map((service) => ({
              service_id: service.serviceId,
              service_name: service.name,
              service_price: service.price,
              pricing_type: service.pricingType,
            }))
          : [],
        availableRoomCount: Math.min(
          ...orderedDocuments.map((document) => Number(document.availableRoomCount) || 0),
        ),
        totalRoomCount: Number(first.totalRooms) || 0,
        maxCapacity: Number(first.capacity) || 0,
        nightlyRates: orderedDocuments.map((document) => ({
          date: document.availableDate,
          rate: Number(document.price) || 0,
          source: document.source?.nightlyRateSource || "snapshot",
        })),
        averageNightlyRate,
        stayTotal,
      });
    }

    const hotelsMap = new Map();
    for (const roomTypeRecord of matchedRoomTypes) {
      const current = hotelsMap.get(roomTypeRecord.hotel_id) || [];
      current.push(roomTypeRecord);
      hotelsMap.set(roomTypeRecord.hotel_id, current);
    }

    const hotelRecords = [];
    for (const roomTypes of hotelsMap.values()) {
      const first = roomTypes[0];
      const document = hits.find(
        (hit) => Number(hit?._source?.roomTypeId) === Number(first.room_type_id),
      )?._source;
      if (!document) {
        continue;
      }

      hotelRecords.push({
        hotel_id: document.hotelId,
        country_name: document.countryName,
        country_code: document.countryCode,
        hotel_name: document.hotelName,
        city_address: document.cityAddress,
        star_rating: document.rating,
        description: document.description,
        timezone: "UTC",
        matchedRoomTypes: roomTypes.sort((a, b) => a.averageNightlyRate - b.averageNightlyRate),
        priceFrom: Math.min(
          ...roomTypes.map((roomTypeRecord) => Number(roomTypeRecord.averageNightlyRate) || 0),
        ),
        stayTotalFrom: Math.min(
          ...roomTypes.map((roomTypeRecord) => Number(roomTypeRecord.stayTotal) || 0),
        ),
        availableRoomCountTotal: roomTypes.reduce(
          (sum, roomTypeRecord) => sum + (Number(roomTypeRecord.availableRoomCount) || 0),
          0,
        ),
      });
    }

    hotelRecords.sort((first, second) => {
      if (sortBy === "price_desc") {
        return second.priceFrom - first.priceFrom;
      }

      if (sortBy === "rating_desc") {
        return second.star_rating - first.star_rating || first.priceFrom - second.priceFrom;
      }

      return first.priceFrom - second.priceFrom || second.star_rating - first.star_rating;
    });

    return toHotelSummaryListResponse(hotelRecords);
  }

  async testQuery(query = {}) {
    const results = await this.searchHotels(query);
    return {
      totalHotels: results.length,
      hotels: results,
    };
  }
}

export const searchService = new SearchService();
