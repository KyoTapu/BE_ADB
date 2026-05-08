import { pool } from "../../../../config/db.config.js";

const seasonalReturningFields = `
  sp.season_id,
  sp.hotel_id,
  h.hotel_name,
  sp.start_date,
  sp.end_date,
  sp.multiplier,
  sp.updated_at
`;

const specificDateReturningFields = `
  sdp.id,
  sdp.room_type_id,
  rt.room_type_name,
  rt.hotel_id,
  h.hotel_name,
  sdp.specific_date,
  sdp.specific_rate,
  sdp.specific_note
`;

class PricingRepository {
  async getStatus() {
    const [seasonalCountResult, specificDateCountResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM seasonalpricing"),
      pool.query("SELECT COUNT(*)::int AS total FROM specialdatepricing"),
    ]);

    return {
      status: "ok",
      seasonalPricingTotal: seasonalCountResult.rows[0]?.total || 0,
      specificDatePricingTotal: specificDateCountResult.rows[0]?.total || 0,
    };
  }

  async getAllSeasonalPricing({ hotel_id, limit = 100, offset = 0 } = {}) {
    const values = [];
    let index = 1;
    let query = `
      SELECT ${seasonalReturningFields}
      FROM seasonalpricing sp
      INNER JOIN hotels h ON h.hotel_id = sp.hotel_id
      WHERE 1 = 1
    `;

    if (hotel_id) {
      query += ` AND sp.hotel_id = $${index}`;
      values.push(hotel_id);
      index++;
    }

    query += ` ORDER BY sp.start_date ASC, sp.season_id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(Math.min(Number(limit) || 100, 100), Math.max(Number(offset) || 0, 0));

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getSeasonalPricingById(id) {
    const query = `
      SELECT ${seasonalReturningFields}
      FROM seasonalpricing sp
      INNER JOIN hotels h ON h.hotel_id = sp.hotel_id
      WHERE sp.season_id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async createSeasonalPricing(data) {
    const query = `
      INSERT INTO seasonalpricing (
        hotel_id,
        start_date,
        end_date,
        multiplier
      )
      VALUES ($1, $2, $3, $4)
      RETURNING season_id
    `;

    const values = [data.hotel_id, data.start_date, data.end_date, data.multiplier];
    const { rows } = await pool.query(query, values);
    return this.getSeasonalPricingById(rows[0]?.season_id);
  }

  async updateSeasonalPricing(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }

    if (!fields.length) {
      return null;
    }

    const query = `
      UPDATE seasonalpricing
      SET ${fields.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE season_id = $${index}
      RETURNING season_id
    `;

    values.push(id);
    const { rows } = await pool.query(query, values);
    if (!rows[0]?.season_id) {
      return null;
    }

    return this.getSeasonalPricingById(rows[0].season_id);
  }

  async deleteSeasonalPricing(id) {
    const query = `
      DELETE FROM seasonalpricing
      WHERE season_id = $1
      RETURNING season_id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async getAllSpecificDatePricing({ hotel_id, room_type_id, limit = 100, offset = 0 } = {}) {
    const values = [];
    let index = 1;
    let query = `
      SELECT ${specificDateReturningFields}
      FROM specialdatepricing sdp
      INNER JOIN room_type rt ON rt.room_type_id = sdp.room_type_id
      INNER JOIN hotels h ON h.hotel_id = rt.hotel_id
      WHERE 1 = 1
    `;

    if (hotel_id) {
      query += ` AND rt.hotel_id = $${index}`;
      values.push(hotel_id);
      index++;
    }

    if (room_type_id) {
      query += ` AND sdp.room_type_id = $${index}`;
      values.push(room_type_id);
      index++;
    }

    query += ` ORDER BY sdp.specific_date ASC, sdp.id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(Math.min(Number(limit) || 100, 100), Math.max(Number(offset) || 0, 0));

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getSpecificDatePricingById(id) {
    const query = `
      SELECT ${specificDateReturningFields}
      FROM specialdatepricing sdp
      INNER JOIN room_type rt ON rt.room_type_id = sdp.room_type_id
      INNER JOIN hotels h ON h.hotel_id = rt.hotel_id
      WHERE sdp.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async createSpecificDatePricing(data) {
    const query = `
      INSERT INTO specialdatepricing (
        room_type_id,
        specific_date,
        specific_rate,
        specific_note
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const values = [data.room_type_id, data.specific_date, data.specific_rate, data.specific_note];
    const { rows } = await pool.query(query, values);
    return this.getSpecificDatePricingById(rows[0]?.id);
  }

  async updateSpecificDatePricing(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }

    if (!fields.length) {
      return null;
    }

    const query = `
      UPDATE specialdatepricing
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id
    `;

    values.push(id);
    const { rows } = await pool.query(query, values);
    if (!rows[0]?.id) {
      return null;
    }

    return this.getSpecificDatePricingById(rows[0].id);
  }

  async deleteSpecificDatePricing(id) {
    const query = `
      DELETE FROM specialdatepricing
      WHERE id = $1
      RETURNING id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async hotelExists(hotelId) {
    const { rows } = await pool.query(
      `
        SELECT hotel_id
        FROM hotels
        WHERE hotel_id = $1
        LIMIT 1
      `,
      [hotelId],
    );
    return Boolean(rows[0]);
  }

  async roomTypeExists(roomTypeId) {
    const { rows } = await pool.query(
      `
        SELECT room_type_id
        FROM room_type
        WHERE room_type_id = $1
        LIMIT 1
      `,
      [roomTypeId],
    );
    return Boolean(rows[0]);
  }

  async findSeasonalPricingOverlap({ hotelId, startDate, endDate, excludeId = null }) {
    const values = [hotelId, startDate, endDate];
    let query = `
      SELECT ${seasonalReturningFields}
      FROM seasonalpricing sp
      INNER JOIN hotels h ON h.hotel_id = sp.hotel_id
      WHERE sp.hotel_id = $1
        AND sp.start_date <= $3
        AND sp.end_date >= $2
    `;

    if (excludeId != null) {
      values.push(excludeId);
      query += ` AND sp.season_id <> $4`;
    }

    query += `
      ORDER BY sp.start_date ASC, sp.season_id DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async findSpecificDatePricingConflict({ roomTypeId, specificDate, excludeId = null }) {
    const values = [roomTypeId, specificDate];
    let query = `
      SELECT ${specificDateReturningFields}
      FROM specialdatepricing sdp
      INNER JOIN room_type rt ON rt.room_type_id = sdp.room_type_id
      INNER JOIN hotels h ON h.hotel_id = rt.hotel_id
      WHERE sdp.room_type_id = $1
        AND sdp.specific_date = $2
    `;

    if (excludeId != null) {
      values.push(excludeId);
      query += ` AND sdp.id <> $3`;
    }

    query += `
      ORDER BY sdp.id DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
}

export const pricingRepository = new PricingRepository();
