import { hotelsRepository } from "./hotels.repository.js";
import { toHotelsListResponse, toHotelsResponse } from "./hotels.model.js";

class HotelsService {
  async getStatus() {
    const hotels = await hotelsRepository.getAll();
    return {
      status: "ok",
      totalHotels: hotels.length,
      lastUpdatedAt: hotels[0]?.updated_at || null,
    };
  }

  async getAllHotels() {
    const hotels = await hotelsRepository.getAll();
    return toHotelsListResponse(hotels);
  }

  async getHotelById(id) {
    const hotel = await hotelsRepository.getByID(id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.status = 404;
      error.code = "HOTEL_NOT_FOUND";
      throw error;
    }

    return toHotelsResponse(hotel);
  }

  async createHotel(payload = {}) {
    const data = {
      country_id: "d210974e-af93-4c04-87c7-bd673a467193", //VN
      hotel_name: String(payload.hotel_name || "").trim(),
      city_address: String(payload.city_address || "").trim(),
      star_rating: payload.star_rating,
      description: payload.description || null,
      timezone: payload.timezone || "UTC",
    };

    if (!data.country_id || !data.hotel_name || !data.city_address || data.star_rating == null) {
      const error = new Error("country_id, hotel_name, city_address and star_rating are required");
      error.status = 400;
      error.code = "MISSING_HOTEL_FIELDS";
      throw error;
    }
    const hotel = await hotelsRepository.create(data);
    console.log("🚀 ~ HotelsService ~ createHotel ~ hotel:", hotel);
    return toHotelsResponse(hotel);
  }

  async updateHotel(id, payload = {}) {
    if (!id) {
      const error = new Error("Hotel id is required");
      error.status = 400;
      error.code = "MISSING_HOTEL_ID";
      throw error;
    }

    // 1. Lấy data hiện tại
    const existingHotel = await hotelsRepository.getByID(id);
    console.log("🚀 ~ HotelsService ~ updateHotel ~ existingHotel:", existingHotel)

    if (!existingHotel) {
      const error = new Error("Hotel not found or already deleted");
      error.status = 404;
      error.code = "HOTEL_NOT_FOUND";
      throw error;
    }

    // 2. Normalize payload
    const normalizedPayload = {
      country_id: payload.country_id,
      hotel_name: payload.hotel_name?.trim(),
      city_address: payload.city_address?.trim(),
      star_rating: payload.star_rating,
      description: payload.description ?? null,
      timezone: payload.timezone ?? existingHotel.timezone, // giữ timezone nếu không gửi
    };

    // 3. Merge data (fallback về giá trị cũ nếu undefined)
    const mergedData = {
      country_id: normalizedPayload.country_id ?? existingHotel.country_id,
      hotel_name: normalizedPayload.hotel_name ?? existingHotel.hotel_name,
      city_address: normalizedPayload.city_address ?? existingHotel.city_address,
      star_rating: normalizedPayload.star_rating ?? existingHotel.star_rating,
      description: normalizedPayload.description ?? existingHotel.description,
      timezone: normalizedPayload.timezone ?? existingHotel.timezone,
    };

    // 4. Detect field thay đổi
    const changedData = {};

    for (const key in mergedData) {
      if (mergedData[key] !== existingHotel[key]) {
        changedData[key] = mergedData[key];
      }
    }

    // 5. Nếu không có gì thay đổi
    if (Object.keys(changedData).length === 0) {
      return toHotelsResponse(existingHotel);
    }

    // 6. Update
    const updatedHotel = await hotelsRepository.update(id, changedData);

    return toHotelsResponse(updatedHotel);
  }
  async softDeleteHotel(id) {
    if (!id) {
      const error = new Error("Hotel id is required");
      error.status = 400;
      error.code = "MISSING_HOTEL_ID";
      throw error;
    }

    const deletedHotel = await hotelsRepository.softDelete(id);
    if (!deletedHotel) {
      const error = new Error("Hotel not found or already deleted");
      error.status = 404;
      error.code = "HOTEL_NOT_FOUND";
      throw error;
    }

    return toHotelsResponse(deletedHotel);
  }

  async restoreHotel(id) {
    if (!id) {
      const error = new Error("Hotel id is required");
      error.status = 400;
      error.code = "MISSING_HOTEL_ID";
      throw error;
    }

    const restoredHotel = await hotelsRepository.restore(id);
    if (!restoredHotel) {
      const error = new Error("Hotel not found");
      error.status = 404;
      error.code = "HOTEL_NOT_FOUND";
      throw error;
    }

    return toHotelsResponse(restoredHotel);
  }

  async hardDeleteHotel(id) {
    if (!id) {
      const error = new Error("Hotel id is required");
      error.status = 400;
      error.code = "MISSING_HOTEL_ID";
      throw error;
    }

    const removedHotel = await hotelsRepository.hardDelete(id);
    if (!removedHotel) {
      const error = new Error("Hotel not found");
      error.status = 404;
      error.code = "HOTEL_NOT_FOUND";
      throw error;
    }

    return toHotelsResponse(removedHotel);
  }
}

export const hotelsService = new HotelsService();
