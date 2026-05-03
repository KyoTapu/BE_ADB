import { pool } from "../../../../config/db.config.js";

const allowedFields = ["hotel_id", "facility_name", "facility_price", "pricing_type"];

const returningFields = `
  service_id,
  hotel_id,
  facility_name,
  facility_price,
  pricing_type,
  created_at,
  updated_at
`;

class FacilitiesRepository {
  baseSelect = `
    SELECT ${returningFields}
    FROM facilities
    WHERE 1 = 1
  `;

  async getStatus() {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM facilities");
    return {
      status: "ok",
      total: rows[0]?.total || 0,
      sourceTable: "facilities",
    };
  }

  async getAll({ hotel_id, search, limit = 100, offset = 0 } = {}) {
    const values = [];
    let index = 1;
    let query = this.baseSelect;

    if (hotel_id) {
      query += ` AND hotel_id = $${index}`;
      values.push(hotel_id);
      index++;
    }

    if (search) {
      query += ` AND facility_name ILIKE $${index}`;
      values.push(`%${String(search).trim()}%`);
      index++;
    }

    query += ` ORDER BY service_id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(Math.min(Number(limit) || 100, 100), Math.max(Number(offset) || 0, 0));

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getByID(id) {
    const query = `${this.baseSelect} AND service_id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async create(data) {
    const query = `
      INSERT INTO facilities (
        hotel_id,
        facility_name,
        facility_price,
        pricing_type
      )
      VALUES ($1, $2, $3, $4)
      RETURNING ${returningFields}
    `;

    const values = [data.hotel_id, data.facility_name, data.facility_price, data.pricing_type];
    const { rows } = await pool.query(query, values);
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
      UPDATE facilities
      SET ${fields.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE service_id = $${index}
      RETURNING ${returningFields}
    `;

    values.push(id);
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async delete(id) {
    const query = `
      DELETE FROM facilities
      WHERE service_id = $1
      RETURNING service_id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async hotelExists(hotelId) {
    const query = `
      SELECT hotel_id
      FROM hotels
      WHERE hotel_id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [hotelId]);
    return Boolean(rows[0]);
  }
}

export const facilitiesRepository = new FacilitiesRepository();
