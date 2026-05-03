import { generateStayDates, buildRoomTypeNightlyRates } from "../booking/booking.pricing.js";
import { clientHotelsRepository } from "./hotels.repository.js";
import {
  toHotelDetailResponse,
  toHotelSummaryListResponse,
} from "./hotels.model.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

class ClientHotelsService {
  parseGuests(rawValue) {
    const matched = String(rawValue || "").match(/\d+/);
    return Math.max(Number(matched?.[0]) || 1, 1);
  }

  buildRoomTypeCatalog(roomTypes, amenities, services, availabilityRows, seasonalRows, specialRows, stayDates) {
    const amenitiesMap = new Map();
    for (const amenity of amenities) {
      const current = amenitiesMap.get(amenity.room_type_id) || [];
      current.push(amenity);
      amenitiesMap.set(amenity.room_type_id, current);
    }

    const servicesMap = new Map();
    for (const service of services) {
      const current = servicesMap.get(service.room_type_id) || [];
      current.push(service);
      servicesMap.set(service.room_type_id, current);
    }

    const availabilityMap = new Map(
      availabilityRows.map((row) => [
        row.room_type_id,
        {
          availableRoomCount: Number(row.available_rooms) || 0,
          totalRoomCount: Number(row.total_rooms) || 0,
          maxCapacity: Number(row.max_capacity) || 0,
        },
      ]),
    );

    const seasonalMap = new Map();
    for (const rule of seasonalRows) {
      const current = seasonalMap.get(rule.hotel_id) || [];
      current.push(rule);
      seasonalMap.set(rule.hotel_id, current);
    }

    const specialMap = new Map();
    for (const rule of specialRows) {
      const current = specialMap.get(rule.room_type_id) || [];
      current.push(rule);
      specialMap.set(rule.room_type_id, current);
    }

    return roomTypes.map((roomType) => {
      const nightlyRates = buildRoomTypeNightlyRates({
        roomType,
        stayDates,
        seasonalPricing: seasonalMap.get(roomType.hotel_id) || [],
        specialDatePricing: specialMap.get(roomType.room_type_id) || [],
      });
      const stayTotal = nightlyRates.reduce((total, night) => total + night.rate, 0);
      const averageNightlyRate = nightlyRates.length ? Math.round(stayTotal / nightlyRates.length) : 0;
      const availability = availabilityMap.get(roomType.room_type_id) || {
        availableRoomCount: 0,
        totalRoomCount: 0,
        maxCapacity: 0,
      };

      return {
        ...roomType,
        amenities: amenitiesMap.get(roomType.room_type_id) || [],
        services: servicesMap.get(roomType.room_type_id) || [],
        nightlyRates,
        stayTotal,
        averageNightlyRate,
        availableRoomCount: availability.availableRoomCount,
        totalRoomCount: availability.totalRoomCount,
        maxCapacity: availability.maxCapacity,
      };
    });
  }

  async getHotelsForSearch(query = {}) {
    const {
      destination,
      roomType,
      amenity,
      guests,
      checkIn,
      checkOut,
      search,
    } = query;

    if (!checkIn || !checkOut) {
      throw createError("checkIn and checkOut are required", 400, "MISSING_STAY_DATES");
    }

    const stayDates = generateStayDates(checkIn, checkOut);
    if (!stayDates.length) {
      throw createError("checkOut must be after checkIn", 400, "INVALID_STAY_DATES");
    }

    const requestedGuests = this.parseGuests(guests);
    const hotelRows = await clientHotelsRepository.getHotels({ search });
    const hotelIds = hotelRows.map((hotel) => hotel.hotel_id);
    const roomTypes = await clientHotelsRepository.getRoomTypesByHotelIds(hotelIds);
    const roomTypeIds = roomTypes.map((roomType) => roomType.room_type_id);
    const [amenities, services, seasonalRows, specialRows, availabilityRows] = await Promise.all([
      clientHotelsRepository.getAmenitiesByRoomTypeIds(roomTypeIds),
      clientHotelsRepository.getServicesByRoomTypeIds(roomTypeIds),
      clientHotelsRepository.getSeasonalPricingByHotelIds(hotelIds),
      clientHotelsRepository.getSpecialDatePricingByRoomTypeIds(roomTypeIds),
      clientHotelsRepository.getRoomAvailabilityByRoomTypeIds(roomTypeIds, checkIn, checkOut),
    ]);

    const roomTypeCatalog = this.buildRoomTypeCatalog(
      roomTypes,
      amenities,
      services,
      availabilityRows,
      seasonalRows,
      specialRows,
      stayDates,
    );

    const roomTypesByHotel = new Map();
    for (const roomTypeRecord of roomTypeCatalog) {
      const current = roomTypesByHotel.get(roomTypeRecord.hotel_id) || [];
      current.push(roomTypeRecord);
      roomTypesByHotel.set(roomTypeRecord.hotel_id, current);
    }

    const filteredHotels = hotelRows
      .filter((hotel) => {
        if (!destination || destination === "Tất cả") return true;
        return hotel.city_address?.toLowerCase().includes(String(destination).toLowerCase());
      })
      .map((hotel) => {
        const matchedRoomTypes = (roomTypesByHotel.get(hotel.hotel_id) || [])
          .filter((item) => (roomType && roomType !== "Tất cả" ? item.room_type_name === roomType : true))
          .filter((item) => item.availableRoomCount > 0)
          .filter((item) => item.totalRoomCount > 0)
          .filter((item) => Number(item.availableRoomCount) > 0)
          .filter((item) => (requestedGuests ? requestedGuests <= Number(item.maxCapacity || 0) : true))
          .filter((item) =>
            amenity && amenity !== "Tất cả"
              ? item.amenities.some((amenityRow) => amenityRow.amenity_name === amenity)
              : true,
          );

        return {
          ...hotel,
          matchedRoomTypes,
          priceFrom: matchedRoomTypes[0]?.averageNightlyRate || 0,
          stayTotalFrom: matchedRoomTypes[0]?.stayTotal || 0,
        };
      })
      .filter((hotel) => hotel.matchedRoomTypes.length > 0)
      .sort((first, second) => first.priceFrom - second.priceFrom || second.star_rating - first.star_rating);

    return toHotelSummaryListResponse(filteredHotels);
  }

  async getHotelDetail(hotelId, query = {}) {
    if (!hotelId) {
      throw createError("hotelId is required", 400, "MISSING_HOTEL_ID");
    }

    const checkIn = query.checkIn;
    const checkOut = query.checkOut;
    if (!checkIn || !checkOut) {
      throw createError("checkIn and checkOut are required", 400, "MISSING_STAY_DATES");
    }

    const stayDates = generateStayDates(checkIn, checkOut);
    if (!stayDates.length) {
      throw createError("checkOut must be after checkIn", 400, "INVALID_STAY_DATES");
    }

    const [hotel] = await clientHotelsRepository.getHotels({ hotelId });
    if (!hotel) {
      throw createError("Hotel not found", 404, "HOTEL_NOT_FOUND");
    }

    const roomTypes = await clientHotelsRepository.getRoomTypesByHotelIds([hotel.hotel_id]);
    const roomTypeIds = roomTypes.map((roomType) => roomType.room_type_id);
    const [amenities, services, seasonalRows, specialRows, availabilityRows] = await Promise.all([
      clientHotelsRepository.getAmenitiesByRoomTypeIds(roomTypeIds),
      clientHotelsRepository.getServicesByRoomTypeIds(roomTypeIds),
      clientHotelsRepository.getSeasonalPricingByHotelIds([hotel.hotel_id]),
      clientHotelsRepository.getSpecialDatePricingByRoomTypeIds(roomTypeIds),
      clientHotelsRepository.getRoomAvailabilityByRoomTypeIds(roomTypeIds, checkIn, checkOut),
    ]);

    const roomTypesWithQuotes = this.buildRoomTypeCatalog(
      roomTypes,
      amenities,
      services,
      availabilityRows,
      seasonalRows,
      specialRows,
      stayDates,
    ).filter((roomType) => roomType.totalRoomCount > 0);

    const hotelServicesMap = new Map();
    for (const roomType of roomTypesWithQuotes) {
      for (const service of roomType.services || []) {
        hotelServicesMap.set(service.service_id, service);
      }
    }

    return toHotelDetailResponse({
      ...hotel,
      roomTypes: roomTypesWithQuotes,
      hotelServices: [...hotelServicesMap.values()],
    });
  }
}

export const clientHotelsService = new ClientHotelsService();
