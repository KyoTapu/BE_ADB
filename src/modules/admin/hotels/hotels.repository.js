import { pool } from "../../../../config/db.config.js";

const allowedFields = ["country_id", "hotel_name", "city_address", "star_rating", "description", "timezone"];

const returningFields = `
  hotel_id,
  country_id,
  hotel_name,
  city_address,
  star_rating,
  description,
  timezone,
  created_at,
  updated_at
`;

class HotelsRepository {
  // Base query (reusable)
  baseSelect = `
    SELECT ${returningFields}
    FROM hotels
    WHERE deleted_at IS NULL
  `;

  // =========================
  // GET ALL (filter + pagination)
  // =========================
  async getAll({ limit = 10, offset = 0, search } = {}) {
    limit = Math.min(limit, 100);
    offset = Math.max(offset, 0);

    let query = this.baseSelect;
    const values = [];
    let index = 1;

    if (search) {
      query += ` AND hotel_name ILIKE $${index}`;
      values.push(`%${search.trim()}%`);
      index++;
    }

    query += ` ORDER BY updated_at DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  }

  // =========================
  // GET BY ID
  // =========================
  async getByID(id) {
    if (!id) throw new Error("Invalid hotel_id");

    const query = `${this.baseSelect} AND hotel_id = $1`;
    const { rows } = await pool.query(query, [id]);

    return rows[0] || null;
  }

  // =========================
  // CREATE
  // =========================
  async create(data) {
    const query = `
      INSERT INTO hotels (
        country_id,
        hotel_name,
        city_address,
        star_rating,
        description,
        timezone
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${returningFields}
    `;

    const values = [
      data.country_id,
      data.hotel_name,
      data.city_address,
      data.star_rating,
      data.description,
      data.timezone || "UTC",
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // =========================
  // UPDATE (PATCH style)
  // =========================
  async update(id, data) {
    if (!id) throw new Error("Invalid hotel_id");

    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      if (!allowedFields.includes(key)) continue;

      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }

    if (fields.length === 0) return null;

    const query = `
      UPDATE hotels
      SET ${fields.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE hotel_id = $${index} AND deleted_at IS NULL
      RETURNING ${returningFields}
    `;

    values.push(id);

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // =========================
  // SOFT DELETE
  // =========================
  async softDelete(id) {
    if (!id) throw new Error("Invalid hotel_id");

    const query = `
      UPDATE hotels
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE hotel_id = $1 AND deleted_at IS NULL
      RETURNING hotel_id, deleted_at
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // =========================
  // RESTORE
  // =========================
  async restore(id) {
    if (!id) throw new Error("Invalid hotel_id");

    const query = `
      UPDATE hotels
      SET deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE hotel_id = $1
      RETURNING ${returningFields}
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // =========================
  // HARD DELETE
  // =========================
  async hardDelete(id) {
    if (!id) throw new Error("Invalid hotel_id");

    const query = `
      DELETE FROM hotels
      WHERE hotel_id = $1
      RETURNING hotel_id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

export const hotelsRepository = new HotelsRepository();
