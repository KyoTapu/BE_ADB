import { getMongoDb } from "../../../../config/mongo.config.js";
import { buildRoomTypeNightlyRates } from "../booking/booking.pricing.js";
import { clientHotelsRepository } from "../hotels/hotels.repository.js";

const COLLECTION_NAME = "room_inventory_daily";

const normalizeDateKey = (dateValue) => new Date(dateValue).toISOString().split("T")[0];

const createSearchTags = (...values) => {
  const tags = new Set();

  for (const value of values.flat()) {
    if (!value) continue;

    String(value)
      .toLowerCase()
      .split(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF]+/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => tags.add(part));
  }

  return [...tags];
};

const createDateRange = (startDate, numberOfDays) => {
  const dates = [];
  const current = new Date(startDate);

  for (let index = 0; index < numberOfDays; index += 1) {
    dates.push(normalizeDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

class RoomInventorySnapshotService {
  async getCollection() {
    const db = await getMongoDb();
    return db.collection(COLLECTION_NAME);
  }

  async ensureIndexes() {
    const collection = await this.getCollection();
    await Promise.all([
      collection.createIndex({ roomTypeId: 1, snapshotDate: 1 }, { unique: true }),
      collection.createIndex({ hotelId: 1, snapshotDate: 1 }),
      collection.createIndex({ snapshotDate: 1 }),
      collection.createIndex({ "pricing.price70": 1 }),
      collection.createIndex({ "inventory.availableRoomCount": 1 }),
      collection.createIndex({ capacity: 1 }),
      collection.createIndex({ rating: -1 }),
      collection.createIndex({ amenities: 1 }),
      collection.createIndex({ serviceNames: 1 }),
      collection.createIndex({ "services.name": 1 }),
      collection.createIndex({ searchTags: 1 }),
      collection.createIndex({ availableRoomCount: 1 }),
    ]);
  }

  async getStatus() {
    const collection = await this.getCollection();
    const [count, firstDocument, lastDocument] = await Promise.all([
      collection.countDocuments(),
      collection.find().sort({ snapshotDate: 1 }).limit(1).next(),
      collection.find().sort({ snapshotDate: -1 }).limit(1).next(),
    ]);

    return {
      collectionName: COLLECTION_NAME,
      documentCount: count,
      dateFrom: firstDocument?.snapshotDate || null,
      dateTo: lastDocument?.snapshotDate || null,
    };
  }

  async replaceDocuments(documents = []) {
    const collection = await this.getCollection();
    await this.ensureIndexes();
    await collection.deleteMany({});

    if (!documents.length) {
      return {
        collectionName: COLLECTION_NAME,
        documents: 0,
      };
    }

    await collection.insertMany(documents, { ordered: false });

    return {
      collectionName: COLLECTION_NAME,
      documents: documents.length,
    };
  }

  async listDocuments({ limit = 100000 } = {}) {
    const collection = await this.getCollection();
    return collection.find({}, { limit }).toArray();
  }

  async syncFromPostgres({ horizonDays = 180 } = {}) {
    const source = await clientHotelsRepository.getSearchIndexSource();
    const documents = this.buildSnapshotDocuments(source, horizonDays);
    const result = await this.replaceDocuments(documents);

    return {
      ...result,
      horizonDays,
    };
  }

  buildSnapshotDocuments(source, horizonDays = 180) {
    const today = normalizeDateKey(new Date());
    const dates = createDateRange(today, horizonDays);

    const hotelsById = new Map(source.hotels.map((hotel) => [hotel.hotel_id, hotel]));
    const amenitiesMap = new Map();
    for (const amenity of source.amenities) {
      const current = amenitiesMap.get(amenity.room_type_id) || [];
      current.push(amenity.amenity_name);
      amenitiesMap.set(amenity.room_type_id, current);
    }

    const servicesMap = new Map();
    for (const service of source.services) {
      const current = servicesMap.get(service.room_type_id) || [];
      current.push(service);
      servicesMap.set(service.room_type_id, current);
    }

    const seasonalMap = new Map();
    for (const row of source.seasonalRows) {
      const current = seasonalMap.get(row.hotel_id) || [];
      current.push(row);
      seasonalMap.set(row.hotel_id, current);
    }

    const specialMap = new Map();
    for (const row of source.specialRows) {
      const current = specialMap.get(row.room_type_id) || [];
      current.push(row);
      specialMap.set(row.room_type_id, current);
    }

    const roomsMap = new Map();
    for (const room of source.rooms) {
      const current = roomsMap.get(room.room_type_id) || [];
      current.push(room);
      roomsMap.set(room.room_type_id, current);
    }

    const bookingMap = new Map();
    for (const booking of source.bookings) {
      const current = bookingMap.get(booking.room_type_id) || [];
      current.push({
        checkIn: normalizeDateKey(booking.check_in),
        checkOut: normalizeDateKey(booking.check_out),
      });
      bookingMap.set(booking.room_type_id, current);
    }

    const documents = [];

    for (const roomType of source.roomTypes) {
      const hotel = hotelsById.get(roomType.hotel_id);
      if (!hotel) {
        continue;
      }

      const rooms = (roomsMap.get(roomType.room_type_id) || []).filter(
        (room) => Boolean(room.is_available),
      );
      const totalRooms = rooms.length;
      if (!totalRooms) {
        continue;
      }

      const maxCapacity = rooms.reduce(
        (maxValue, room) => Math.max(maxValue, Number(room.capacity) || 0),
        0,
      );

      const amenities = [...new Set(amenitiesMap.get(roomType.room_type_id) || [])];
      const serviceCatalog = (servicesMap.get(roomType.room_type_id) || []).map((service) => ({
        serviceId: service.service_id,
        name: service.service_name,
        price: Number(service.service_price) || 0,
        pricingType: service.pricing_type || "per_use",
      }));
      const serviceNames = [...new Set(serviceCatalog.map((service) => service.name).filter(Boolean))];
      const bookingRanges = bookingMap.get(roomType.room_type_id) || [];

      const nightlyRates = buildRoomTypeNightlyRates({
        roomType: {
          basePrice: roomType.room_type_base_price,
        },
        stayDates: dates,
        seasonalPricing: seasonalMap.get(roomType.hotel_id) || [],
        specialDatePricing: specialMap.get(roomType.room_type_id) || [],
      });

      for (const nightlyRate of nightlyRates) {
        const date = nightlyRate.date;
        const specificRule =
          (specialMap.get(roomType.room_type_id) || []).find(
            (rule) => normalizeDateKey(rule.specific_date) === date,
          ) || null;
        const seasonalRule =
          (seasonalMap.get(roomType.hotel_id) || []).find((rule) => {
            const startDate = normalizeDateKey(rule.start_date);
            const endDate = normalizeDateKey(rule.end_date);
            return date >= startDate && date <= endDate;
          }) || null;
        const bookedCount = bookingRanges.reduce((count, booking) => {
          if (date >= booking.checkIn && date < booking.checkOut) {
            return count + 1;
          }
          return count;
        }, 0);

        const availableRoomCount = Math.max(totalRooms - bookedCount, 0);
        if (!availableRoomCount) {
          continue;
        }

        documents.push({
          _id: `roomType:${roomType.room_type_id}:${date}`,
          snapshotDate: date,
          roomTypeId: roomType.room_type_id,
          hotelId: hotel.hotel_id,
          hotelName: hotel.hotel_name,
          countryName: hotel.country_name || "",
          countryCode: hotel.country_code || "",
          cityAddress: hotel.city_address || "",
          location: {
            lat: null,
            lon: null,
          },
          roomTypeName: roomType.room_type_name,
          servicesText: roomType.room_type_services || "",
          capacity: maxCapacity,
          rating: Number(hotel.star_rating) || 0,
          inventory: {
            totalRooms,
            bookedRooms: bookedCount,
            availableRoomCount,
          },
          totalRooms,
          bookedRooms: bookedCount,
          availableRoomCount,
          amenities,
          services: serviceCatalog,
          serviceNames,
          searchTags: createSearchTags(
            roomType.room_type_name,
            hotel.hotel_name,
            hotel.city_address,
            amenities,
            serviceNames,
          ),
          pricing: {
            basePrice: Number(roomType.room_type_base_price) || 0,
            seasonalMultiplier: seasonalRule ? Number(seasonalRule.multiplier) || 1 : 1,
            specificDateRate: specificRule ? Number(specificRule.specific_rate) || 0 : null,
            computedRoomPrice: Number(nightlyRate.rate) || 0,
            price70: Number(nightlyRate.rate) || 0,
            serviceAndTaxDeferred: true,
          },
          source: {
            seasonalRuleId: seasonalRule?.season_id ?? null,
            specificDatePricingId: specificRule?.id ?? null,
            nightlyRateSource: nightlyRate.source,
          },
          description: hotel.description || "",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return documents;
  }
}

export const roomInventorySnapshotService = new RoomInventorySnapshotService();
