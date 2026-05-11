import { Router } from "express";
import { query } from "../configs/postgres.js";
import { getPagination } from "./pagination.js";
import { badRequest, notFound } from "./errors.js";
import { sendSuccess } from "./response.js";

const sanitizePayload = (payload = {}, allowedFields = []) => {
  const cleanPayload = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      cleanPayload[field] = payload[field];
    }
  }

  return cleanPayload;
};

export const createCrudRepository = (model) => {
  const {
    tableName,
    primaryKey = "id",
    defaultOrderBy = primaryKey,
    filterableFields = [],
    searchableFields = [],
    createFields = [],
    updateFields = [],
    defaultCreatePayload = {},
    updatedAtField = null,
  } = model;

  return {
    async list(rawQuery = {}) {
      const pagination = getPagination(rawQuery);
      const filters = [];
      const values = [];
      const q = String(rawQuery.q || "").trim();

      for (const field of filterableFields) {
        if (rawQuery[field] !== undefined && rawQuery[field] !== "") {
          values.push(rawQuery[field]);
          filters.push(`${field} = $${values.length}`);
        }
      }

      if (q && searchableFields.length > 0) {
        const searchConditions = searchableFields.map((field) => {
          values.push(`%${q}%`);
          return `${field}::text ILIKE $${values.length}`;
        });

        filters.push(`(${searchConditions.join(" OR ")})`);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

      const listSql = `
        SELECT *
        FROM ${tableName}
        ${whereClause}
        ORDER BY ${defaultOrderBy} DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `;

      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM ${tableName}
        ${whereClause}
      `;

      const [{ rows }, countResult] = await Promise.all([
        query(listSql, [...values, pagination.limit, pagination.offset]),
        query(countSql, values),
      ]);

      return {
        items: rows,
        pagination: {
          ...pagination,
          total: countResult.rows[0]?.total || 0,
        },
      };
    },

    async getById(id) {
      const { rows } = await query(
        `SELECT * FROM ${tableName} WHERE ${primaryKey} = $1 LIMIT 1`,
        [id],
      );

      return rows[0] || null;
    },

    async create(payload = {}) {
      const record = sanitizePayload(
        {
          ...defaultCreatePayload,
          ...payload,
        },
        createFields,
      );

      const entries = Object.entries(record);
      if (entries.length === 0) {
        throw badRequest("Payload is empty", "EMPTY_PAYLOAD");
      }

      const columns = entries.map(([key]) => key);
      const values = entries.map(([, value]) => value);
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const sql = `
        INSERT INTO ${tableName} (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

      const { rows } = await query(sql, values);
      return rows[0];
    },

    async update(id, payload = {}) {
      const record = sanitizePayload(payload, updateFields);
      if (updatedAtField && record[updatedAtField] === undefined) {
        record[updatedAtField] = new Date();
      }

      const entries = Object.entries(record);
      if (entries.length === 0) {
        throw badRequest("Payload is empty", "EMPTY_PAYLOAD");
      }

      const values = [];
      const setClause = entries
        .map(([key, value], index) => {
          values.push(value);
          return `${key} = $${index + 1}`;
        })
        .join(", ");

      values.push(id);

      const sql = `
        UPDATE ${tableName}
        SET ${setClause}
        WHERE ${primaryKey} = $${values.length}
        RETURNING *
      `;

      const { rows } = await query(sql, values);
      if (!rows[0]) {
        throw notFound("Resource not found", "RESOURCE_NOT_FOUND");
      }

      return rows[0];
    },

    async remove(id) {
      const { rows } = await query(
        `DELETE FROM ${tableName} WHERE ${primaryKey} = $1 RETURNING *`,
        [id],
      );

      if (!rows[0]) {
        throw notFound("Resource not found", "RESOURCE_NOT_FOUND");
      }

      return rows[0];
    },
  };
};

export const createCrudService = (repository, model) => {
  const mapResponse = model.toResponse || ((value) => value);

  return {
    async list(queryParams) {
      const result = await repository.list(queryParams);
      return {
        ...result,
        items: result.items.map(mapResponse),
      };
    },

    async getById(id) {
      const item = await repository.getById(id);
      if (!item) {
        throw notFound("Resource not found", "RESOURCE_NOT_FOUND");
      }

      return mapResponse(item);
    },

    async create(payload) {
      return mapResponse(await repository.create(payload));
    },

    async update(id, payload) {
      return mapResponse(await repository.update(id, payload));
    },

    async remove(id) {
      return mapResponse(await repository.remove(id));
    },
  };
};

export const createCrudController = (service) => ({
  async list(req, res, next) {
    try {
      return sendSuccess(res, await service.list(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      return sendSuccess(res, await service.getById(req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      return sendSuccess(res, await service.create(req.body), 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      return sendSuccess(res, await service.update(req.params.id, req.body));
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      return sendSuccess(res, await service.remove(req.params.id));
    } catch (error) {
      return next(error);
    }
  },
});

export const createCrudRouter = (controller) => {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
};
