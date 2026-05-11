import { badRequest, notFound } from "../../common/errors.js";
import { createCrudService } from "../../common/crud.js";
import { query, withTransaction } from "../../configs/postgres.js";
import { roomTypesModel } from "./room-types.model.js";
import { roomTypesRepository } from "./room-types.repository.js";

const AUTO_GENERATE_HORIZON_DAYS = 180;

const sanitizePayload = (payload = {}, allowedFields = []) => {
  const cleanPayload = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      cleanPayload[field] = payload[field];
    }
  }

  return cleanPayload;
};

const enumerateDates = (horizonDays) => {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let index = 0; index < horizonDays; index += 1) {
    const nextDate = new Date(cursor);
    nextDate.setDate(cursor.getDate() + index);
    dates.push(nextDate.toISOString().split("T")[0]);
  }

  return dates;
};

const baseService = createCrudService(roomTypesRepository, roomTypesModel);

const normalizeIdArray = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

const buildRoomTypeAssociations = async (client, roomTypeId, payload = {}) => {
  const amenityIds = normalizeIdArray(payload.amenity_ids);
  const facilityIds = normalizeIdArray(payload.facility_ids);

  await client.query("DELETE FROM public.room_type_amenities WHERE room_type_id = $1", [roomTypeId]);
  await client.query("DELETE FROM public.room_type_facilities WHERE room_type_id = $1", [roomTypeId]);

  if (amenityIds.length) {
    await client.query(
      `
        INSERT INTO public.room_type_amenities (room_type_id, amenity_id)
        SELECT $1::uuid, amenity_id
        FROM unnest($2::uuid[]) AS amenity_id
      `,
      [roomTypeId, amenityIds],
    );
  }

  if (facilityIds.length) {
    await client.query(
      `
        INSERT INTO public.room_type_facilities (room_type_id, facility_id, included, discount_percent)
        SELECT $1::uuid, facility_id, TRUE, 0
        FROM unnest($2::uuid[]) AS facility_id
      `,
      [roomTypeId, facilityIds],
    );
  }
};

const roomTypesSelectSql = `
  SELECT
    rt.*,
    COALESCE(amenity_links.amenity_ids, ARRAY[]::uuid[]) AS amenity_ids,
    COALESCE(facility_links.facility_ids, ARRAY[]::uuid[]) AS facility_ids
  FROM public.room_types rt
  LEFT JOIN (
    SELECT room_type_id, array_agg(amenity_id ORDER BY amenity_id) AS amenity_ids
    FROM public.room_type_amenities
    GROUP BY room_type_id
  ) amenity_links ON amenity_links.room_type_id = rt.id
  LEFT JOIN (
    SELECT room_type_id, array_agg(facility_id ORDER BY facility_id) AS facility_ids
    FROM public.room_type_facilities
    GROUP BY room_type_id
  ) facility_links ON facility_links.room_type_id = rt.id
`;

const mapRoomTypeResponse = (item = {}) => ({
  ...item,
  amenity_ids: Array.isArray(item.amenity_ids) ? item.amenity_ids.map(String) : [],
  facility_ids: Array.isArray(item.facility_ids) ? item.facility_ids.map(String) : [],
});

export const roomTypesService = {
  ...baseService,

  async list(rawQuery = {}) {
    const filters = [];
    const values = [];
    const page = Math.max(1, Number(rawQuery.page) || 1);
    const limit = Math.max(1, Number(rawQuery.limit) || 20);
    const offset = (page - 1) * limit;
    const q = String(rawQuery.q || "").trim();

    for (const field of roomTypesModel.filterableFields || []) {
      if (rawQuery[field] !== undefined && rawQuery[field] !== "") {
        values.push(rawQuery[field]);
        filters.push(`rt.${field} = $${values.length}`);
      }
    }

    if (q && roomTypesModel.searchableFields?.length) {
      const clauses = roomTypesModel.searchableFields.map((field) => {
        values.push(`%${q}%`);
        return `rt.${field}::text ILIKE $${values.length}`;
      });
      filters.push(`(${clauses.join(" OR ")})`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const { rows } = await query(
      `
        ${roomTypesSelectSql}
        ${whereClause}
        ORDER BY rt.created_at DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      [...values, limit, offset],
    );

    const countResult = await query(
      `
        SELECT COUNT(*)::int AS total
        FROM public.room_types rt
        ${whereClause}
      `,
      values,
    );

    return {
      items: rows.map(mapRoomTypeResponse),
      pagination: {
        page,
        limit,
        total: countResult.rows[0]?.total || 0,
      },
    };
  },

  async getById(id) {
    const { rows } = await query(
      `
        ${roomTypesSelectSql}
        WHERE rt.id = $1
        LIMIT 1
      `,
      [id],
    );

    if (!rows[0]) {
      throw notFound("Resource not found", "RESOURCE_NOT_FOUND");
    }

    return mapRoomTypeResponse(rows[0]);
  },

  async create(payload = {}) {
    const record = sanitizePayload(payload, roomTypesModel.createFields);
    const entries = Object.entries(record);

    if (!entries.length) {
      throw badRequest("Payload is empty", "EMPTY_PAYLOAD");
    }

    return withTransaction(async (client) => {
      const columns = entries.map(([key]) => key);
      const values = entries.map(([, value]) => value);
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const roomTypeResult = await client.query(
        `
          INSERT INTO public.room_types (${columns.join(", ")})
          VALUES (${placeholders.join(", ")})
          RETURNING *
        `,
        values,
      );

      const roomType = roomTypeResult.rows[0];
      const dates = enumerateDates(AUTO_GENERATE_HORIZON_DAYS);
      const totalInventory = Number(roomType.total_inventory || 0);
      const soldInventory = 0;
      const availableInventory = Math.max(totalInventory - soldInventory, 0);
      const baseRate = Number(roomType.base_price || 0);

      await client.query(
        `
          INSERT INTO public.daily_inventory (
            hotel_id,
            room_type_id,
            inventory_date,
            total_inventory,
            sold_inventory,
            available_inventory,
            stop_sell,
            closed
          )
          SELECT
            $1::uuid,
            $2::uuid,
            d.inventory_date,
            $3::int,
            $4::int,
            $5::int,
            FALSE,
            FALSE
          FROM unnest($6::date[]) AS d(inventory_date)
          ON CONFLICT (room_type_id, inventory_date)
          DO NOTHING
        `,
        [
          roomType.hotel_id,
          roomType.id,
          totalInventory,
          soldInventory,
          availableInventory,
          dates,
        ],
      );

      await client.query(
        `
          INSERT INTO public.daily_rates (
            hotel_id,
            room_type_id,
            rate_plan_id,
            rate_date,
            base_rate,
            occupancy_factor,
            season_factor,
            weekend_factor,
            event_factor,
            demand_factor,
            final_rate,
            currency,
            stop_sell,
            closed
          )
          SELECT
            $1::uuid,
            $2::uuid,
            NULL,
            d.rate_date,
            $3::numeric,
            1.00,
            1.00,
            1.00,
            1.00,
            1.00,
            $3::numeric,
            'VND',
            FALSE,
            FALSE
          FROM unnest($4::date[]) AS d(rate_date)
          WHERE NOT EXISTS (
            SELECT 1
            FROM public.daily_rates dr
            WHERE dr.room_type_id = $2::uuid
              AND dr.rate_date = d.rate_date
              AND dr.rate_plan_id IS NULL
          )
        `,
        [roomType.hotel_id, roomType.id, baseRate, dates],
      );

      await buildRoomTypeAssociations(client, roomType.id, payload);

      const hydratedResult = await client.query(
        `
          ${roomTypesSelectSql}
          WHERE rt.id = $1
          LIMIT 1
        `,
        [roomType.id],
      );

      return mapRoomTypeResponse(hydratedResult.rows[0]);
    });
  },

  async update(id, payload = {}) {
    const record = sanitizePayload(payload, roomTypesModel.updateFields);
    const entries = Object.entries(record);

    if (!entries.length && payload.amenity_ids === undefined && payload.facility_ids === undefined) {
      throw badRequest("Payload is empty", "EMPTY_PAYLOAD");
    }

    return withTransaction(async (client) => {
      let roomTypeId = id;

      if (entries.length) {
        if (record.updated_at === undefined) {
          record.updated_at = new Date();
        }

        const nextEntries = Object.entries(record);
        const values = [];
        const setClause = nextEntries
          .map(([key, value], index) => {
            values.push(value);
            return `${key} = $${index + 1}`;
          })
          .join(", ");

        values.push(id);

        const updateResult = await client.query(
          `
            UPDATE public.room_types
            SET ${setClause}
            WHERE id = $${values.length}
            RETURNING id
          `,
          values,
        );

        if (!updateResult.rows[0]) {
          throw notFound("Resource not found", "RESOURCE_NOT_FOUND");
        }

        roomTypeId = updateResult.rows[0].id;
      }

      if (payload.amenity_ids !== undefined || payload.facility_ids !== undefined) {
        await buildRoomTypeAssociations(client, roomTypeId, payload);
      }

      const hydratedResult = await client.query(
        `
          ${roomTypesSelectSql}
          WHERE rt.id = $1
          LIMIT 1
        `,
        [roomTypeId],
      );

      return mapRoomTypeResponse(hydratedResult.rows[0]);
    });
  },
};
