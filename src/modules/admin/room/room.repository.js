import { pool } from "../../../../config/db.config.js";

const roomTypeFields = ["hotel_id", "room_type_name", "room_type_base_price", "room_type_services"];
const roomFields = ["room_type_id", "name", "floor", "number", "capacity", "is_available", "status"];

const roomTypeReturning = `
  room_type_id,
  hotel_id,
  room_type_name,
  room_type_base_price,
  room_type_services
`;

const roomReturning = `
  room_id,
  room_type_id,
  name,
  floor,
  number,
  capacity,
  is_available,
  status,
  created_at,
  updated_at
`;

const amenityReturning = `
  amenity_id,
  hotel_id,
  amenity_name,
  amenity_description,
  created_at,
  updated_at
`;

const facilityRelationReturning = `
  rts.room_type_id,
  f.service_id,
  f.hotel_id,
  f.facility_name,
  f.facility_price,
  f.pricing_type,
  f.created_at,
  f.updated_at
`;

class RoomRepository {
  baseRoomType = `
    SELECT ${roomTypeReturning}
    FROM room_type
    WHERE 1 = 1
  `;

  async getAllRoomTypes({ limit = 100, offset = 0, hotel_id } = {}) {
    let query = this.baseRoomType;
    const values = [];
    let index = 1;

    if (hotel_id) {
      query += ` AND hotel_id = $${index}`;
      values.push(hotel_id);
      index++;
    }

    query += ` ORDER BY room_type_id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(Math.min(Number(limit) || 100, 100), Math.max(Number(offset) || 0, 0));

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getRoomTypeByID(id, client = pool) {
    if (!id) throw new Error("Invalid room_type_id");

    const query = `${this.baseRoomType} AND room_type_id = $1`;
    const { rows } = await client.query(query, [id]);
    return rows[0] || null;
  }

  async createRoomType(data, client = pool) {
    const query = `
      INSERT INTO room_type (
        hotel_id,
        room_type_name,
        room_type_base_price,
        room_type_services
      )
      VALUES ($1, $2, $3, $4)
      RETURNING ${roomTypeReturning}
    `;

    const values = [
      data.hotel_id,
      data.room_type_name,
      data.room_type_base_price,
      data.room_type_services ?? null,
    ];

    const { rows } = await client.query(query, values);
    return rows[0];
  }

  async updateRoomType(id, data, client = pool) {
    if (!id) throw new Error("Invalid room_type_id");

    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      if (!roomTypeFields.includes(key)) continue;
      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }

    if (!fields.length) return null;

    const query = `
      UPDATE room_type
      SET ${fields.join(", ")}
      WHERE room_type_id = $${index}
      RETURNING ${roomTypeReturning}
    `;

    values.push(id);

    const { rows } = await client.query(query, values);
    return rows[0] || null;
  }

  async deleteRoomType(id, client = pool) {
    const query = `
      DELETE FROM room_type
      WHERE room_type_id = $1
      RETURNING room_type_id
    `;
    const { rows } = await client.query(query, [id]);
    return rows[0] || null;
  }

  async getAmenitiesByRoomTypeIds(roomTypeIds, client = pool) {
    if (!roomTypeIds.length) return [];

    const query = `
      SELECT
        rta.room_type_id,
        ${amenityReturning}
      FROM room_type_amenity rta
      JOIN amenities a ON a.amenity_id = rta.amenity_id
      WHERE rta.room_type_id = ANY($1::int[])
      ORDER BY a.amenity_id DESC
    `;

    const { rows } = await client.query(query, [roomTypeIds]);
    return rows;
  }

  async getAmenitiesByIds(amenityIds, client = pool) {
    if (!amenityIds.length) return [];

    const query = `
      SELECT ${amenityReturning}
      FROM amenities
      WHERE amenity_id = ANY($1::int[])
    `;

    const { rows } = await client.query(query, [amenityIds]);
    return rows;
  }

  async getFacilitiesByRoomTypeIds(roomTypeIds, client = pool) {
    if (!roomTypeIds.length) return [];

    const query = `
      SELECT ${facilityRelationReturning}
      FROM room_type_service rts
      JOIN facilities f ON f.service_id = rts.facilities_id
      WHERE rts.room_type_id = ANY($1::int[])
      ORDER BY f.service_id DESC
    `;

    const { rows } = await client.query(query, [roomTypeIds]);
    return rows;
  }

  async getFacilitiesByIds(facilityIds, client = pool) {
    if (!facilityIds.length) return [];

    const query = `
      SELECT
        service_id,
        hotel_id,
        facility_name,
        facility_price,
        pricing_type,
        created_at,
        updated_at
      FROM facilities
      WHERE service_id = ANY($1::int[])
    `;

    const { rows } = await client.query(query, [facilityIds]);
    return rows;
  }

  async replaceRoomTypeFacilities(roomTypeId, facilityIds, client = pool) {
    await client.query("DELETE FROM room_type_service WHERE room_type_id = $1", [roomTypeId]);

    if (!facilityIds.length) {
      return;
    }

    const values = [];
    const placeholders = facilityIds.map((facilityId, index) => {
      const baseIndex = index * 2;
      values.push(roomTypeId, facilityId);
      return `($${baseIndex + 1}, $${baseIndex + 2})`;
    });

    const query = `
      INSERT INTO room_type_service (room_type_id, facilities_id)
      VALUES ${placeholders.join(", ")}
    `;

    await client.query(query, values);
  }

  async replaceRoomTypeAmenities(roomTypeId, amenityIds, client = pool) {
    await client.query("DELETE FROM room_type_amenity WHERE room_type_id = $1", [roomTypeId]);

    if (!amenityIds.length) {
      return;
    }

    const values = [];
    const placeholders = amenityIds.map((amenityId, index) => {
      const baseIndex = index * 2;
      values.push(roomTypeId, amenityId);
      return `($${baseIndex + 1}, $${baseIndex + 2})`;
    });

    const query = `
      INSERT INTO room_type_amenity (room_type_id, amenity_id)
      VALUES ${placeholders.join(", ")}
    `;

    await client.query(query, values);
  }

  async deleteRoomTypeRelations(roomTypeId, client = pool) {
    await client.query("DELETE FROM room_type_service WHERE room_type_id = $1", [roomTypeId]);
    await client.query("DELETE FROM room_type_amenity WHERE room_type_id = $1", [roomTypeId]);
  }

  baseRoom = `
    SELECT ${roomReturning}
    FROM rooms
    WHERE 1 = 1
  `;

  async getAllRooms({ limit = 10, offset = 0, room_type_id } = {}) {
    let query = `
      SELECT ${roomReturning}
      FROM rooms
      WHERE 1 = 1
    `;

    const values = [];
    let index = 1;

    if (room_type_id) {
      query += ` AND room_type_id = $${index}`;
      values.push(room_type_id);
      index++;
    }

    query += ` ORDER BY updated_at DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getRoomByID(id) {
    if (!id) throw new Error("Invalid room_id");

    const query = `${this.baseRoom} AND room_id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async createRoom(data) {
    const query = `
      INSERT INTO rooms (
        room_type_id,
        name,
        floor,
        number,
        capacity,
        is_available,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${roomReturning}
    `;

    const values = [
      data.room_type_id,
      data.name,
      data.floor,
      data.number,
      data.capacity,
      data.is_available ?? true,
      data.status || "Available",
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async updateRoom(id, data) {
    if (!id) throw new Error("Invalid room_id");

    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      if (!roomFields.includes(key)) continue;
      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }

    if (!fields.length) return null;

    const query = `
      UPDATE rooms
      SET ${fields.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE room_id = $${index}
      RETURNING ${roomReturning}
    `;

    values.push(id);

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async deleteRoom(id) {
    const query = `
      DELETE FROM rooms
      WHERE room_id = $1
      RETURNING room_id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async getRoomWithType(id) {
    const query = `
      SELECT
        r.*,
        rt.room_type_name,
        rt.room_type_base_price,
        rt.room_type_services
      FROM rooms r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

export const roomRepository = new RoomRepository();
