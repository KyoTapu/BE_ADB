import { pool } from "../../../../config/db.config.js";

const returningFields = `
  country_id,
  country_code,
  country_name
`;

class CountryRepository {
  baseSelect = `
    SELECT ${returningFields}
    FROM country
    WHERE 1 = 1
  `;

  async getAll({ limit = 100, offset = 0, search } = {}) {
    limit = Math.min(limit, 100);
    offset = Math.max(offset, 0);

    let query = this.baseSelect;
    const values = [];
    let index = 1;

    if (search) {
      query += ` AND country_name ILIKE $${index}`;
      values.push(`%${search.trim()}%`);
      index++;
    }

    query += ` ORDER BY updated_at DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getByID(id) {
    if (!id) throw new Error("Invalid country_id");

    const query = `${this.baseSelect} AND country_id = $1`;
    const { rows } = await pool.query(query, [id]);

    return rows[0] || null;
  }

  async create(data) {
    const query = `
      INSERT INTO country (
        country_code,
        country_name
      )
      VALUES ($1, $2)
      RETURNING ${returningFields}
    `;

    const values = [data.country_code, data.country_name];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async update(id, data) {
    if (!id) throw new Error("Invalid country_id");

    const fields = [];
    const values = [];
    let index = 1;

    if (data.country_code !== undefined) {
      fields.push(`country_code = $${index++}`);
      values.push(data.country_code);
    }

    if (data.country_name !== undefined) {
      fields.push(`country_name = $${index++}`);
      values.push(data.country_name);
    }

    if (!fields.length) {
      return null;
    }

    values.push(id);

    const query = `
      UPDATE country
      SET ${fields.join(", ")}
      WHERE country_id = $${index}
      RETURNING ${returningFields}
    `;

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async softDelete(id) {
    if (!id) throw new Error("Invalid country_id");

    const query = `
      DELETE FROM country
      WHERE country_id = $1
      RETURNING country_id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async hardDelete(id) {
    if (!id) throw new Error("Invalid country_id");

    const query = `
      DELETE FROM country
      WHERE country_id = $1
      RETURNING country_id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async hasHotels(id) {
    const query = `
      SELECT 1
      FROM hotels
      WHERE country_id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id]);
    return Boolean(rows[0]);
  }
}

export const countryRepository = new CountryRepository();
