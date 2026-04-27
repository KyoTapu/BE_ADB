import { pool } from "../../../../config/db.config.js";

const allowedFields = ["room_type_id", "amenity_name"];

const returningFields = `
  amenity_id,
  room_type_id,
  amenity_name
`;

class AmenitiesRepository {
  baseSelect = `
    SELECT ${returningFields}
    FROM amenities
    WHERE 1 = 1
  `;

  async getStatus() {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM amenities");
    return {
      status: "ok",
      total: rows[0]?.total || 0,
    };
  }

  async getAll({ room_type_id, search, limit = 100, offset = 0 } = {}) {
    const values = [];
    let index = 1;
    let query = this.baseSelect;

    if (room_type_id) {
      query += ` AND room_type_id = $${index}`;
      values.push(room_type_id);
      index++;
    }

    if (search) {
      query += ` AND amenity_name ILIKE $${index}`;
      values.push(`%${String(search).trim()}%`);
      index++;
    }

    query += ` ORDER BY amenity_id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(Math.min(Number(limit) || 100, 100), Math.max(Number(offset) || 0, 0));

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getByID(id) {
    const query = `${this.baseSelect} AND amenity_id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async create(data) {
    const query = `
      INSERT INTO amenities (
        room_type_id,
        amenity_name
      )
      VALUES ($1, $2)
      RETURNING ${returningFields}
    `;

    const { rows } = await pool.query(query, [data.room_type_id, data.amenity_name]);
    return rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      if (!allowedFields.includes(key)) continue;
      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }

    if (!fields.length) return null;

    const query = `
      UPDATE amenities
      SET ${fields.join(", ")}
      WHERE amenity_id = $${index}
      RETURNING ${returningFields}
    `;

    values.push(id);
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async delete(id) {
    const query = `
      DELETE FROM amenities
      WHERE amenity_id = $1
      RETURNING amenity_id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async roomTypeExists(roomTypeId) {
    const query = `
      SELECT room_type_id
      FROM room_type
      WHERE room_type_id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [roomTypeId]);
    return Boolean(rows[0]);
  }
}

export const amenitiesRepository = new AmenitiesRepository();
