import { pool } from "../../../../config/db.config.js";

/* =========================
   COMMON CONFIG
========================= */

const roomTypeFields = ["hotel_id", "room_type_name", "room_type_base_price", "room_type_services"];

const roomFields = ["room_type_id", "name", "floor", "number", "capacity", "is_available", "status"];

const roomTypeReturning = `
  room_type_id,
  hotel_id,
  room_type_name,
  room_type_base_price,
  room_type_services,
  created_at,
  updated_at
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

/* =========================
   REPOSITORY
========================= */

class RoomRepository {
  /* =========================
     ROOM TYPE
  ========================= */

  baseRoomType = `
    SELECT ${roomTypeReturning}
    FROM room_type
    WHERE deleted_at IS NULL
  `;

  async getAllRoomTypes({ limit = 10, offset = 0 } = {}) {
    const query = `
      ${this.baseRoomType}
      ORDER BY updated_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [limit, offset]);
    return rows;
  }

  async getRoomTypeByID(id) {
    if (!id) throw new Error("Invalid room_type_id");

    const query = `${this.baseRoomType} AND room_type_id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async createRoomType(data) {
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

    const values = [data.hotel_id, data.room_type_name, data.room_type_base_price, data.room_type_services];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async updateRoomType(id, data) {
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
      SET ${fields.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE room_type_id = $${index} AND deleted_at IS NULL
      RETURNING ${roomTypeReturning}
    `;

    values.push(id);

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async deleteRoomType(id) {
    const query = `
      UPDATE room_type
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE room_type_id = $1 AND deleted_at IS NULL
      RETURNING room_type_id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
     ROOMS
  ========================= */

  baseRoom = `
    SELECT ${roomReturning}
    FROM rooms
    WHERE deleted_at IS NULL
  `;

  async getAllRooms({ limit = 10, offset = 0, room_type_id } = {}) {
    let query = `
    SELECT ${roomReturning}
    FROM rooms
    WHERE deleted_at IS NULL
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
      WHERE room_id = $${index} AND deleted_at IS NULL
      RETURNING ${roomReturning}
    `;

    values.push(id);

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async deleteRoom(id) {
    const query = `
      UPDATE rooms
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE room_id = $1 AND deleted_at IS NULL
      RETURNING room_id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
     JOIN (rất useful 🔥)
  ========================= */

  async getRoomWithType(id) {
    const query = `
      SELECT 
        r.*,
        rt.room_type_name,
        rt.room_type_base_price
      FROM rooms r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = $1
        AND r.deleted_at IS NULL
        AND rt.deleted_at IS NULL
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

export const roomRepository = new RoomRepository();
