import { badRequest, notFound } from "../../common/errors.js";
import { pricingRulesRepository } from "./pricing-rules.repository.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatItem = (item = {}) => ({
  ...item,
  id: item?._id ? String(item._id) : "",
  _id: undefined,
});

const ensureValidId = (id) => {
  const normalized = String(id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(normalized)) {
    throw badRequest("Invalid pricing rule id", "INVALID_PRICING_RULE_ID");
  }
  return normalized;
};

const validatePayload = (payload = {}, isUpdate = false) => {
  const nextPayload = {};

  if (!isUpdate || payload.hotel_id !== undefined) {
    const hotelId = String(payload.hotel_id || "").trim();
    if (!hotelId) throw badRequest("hotel_id is required", "INVALID_PRICING_RULE");
    nextPayload.hotel_id = hotelId;
  }

  if (!isUpdate || payload.room_type_id !== undefined) {
    const roomTypeId = String(payload.room_type_id || "").trim();
    if (!roomTypeId) throw badRequest("room_type_id is required", "INVALID_PRICING_RULE");
    nextPayload.room_type_id = roomTypeId;
  }

  if (!isUpdate || payload.type !== undefined) {
    const type = String(payload.type || "").trim();
    if (!["single_day", "date_range"].includes(type)) {
      throw badRequest("type must be single_day or date_range", "INVALID_PRICING_RULE_TYPE");
    }
    nextPayload.type = type;
  }

  if (!isUpdate || payload.priority !== undefined) {
    nextPayload.priority = toNumber(payload.priority, 100);
  }

  if (payload.active !== undefined || !isUpdate) {
    nextPayload.active = payload.active !== undefined ? Boolean(payload.active) : true;
  }

  if (!isUpdate || payload.conditions !== undefined) {
    const conditions = payload.conditions && typeof payload.conditions === "object" ? payload.conditions : {};
    nextPayload.conditions = conditions;
  }

  if (!isUpdate || payload.actions !== undefined) {
    const actions = payload.actions && typeof payload.actions === "object" ? payload.actions : {};
    nextPayload.actions = actions;
  }

  if (payload.name !== undefined || !isUpdate) {
    nextPayload.name = String(payload.name || "").trim() || null;
  }

  if (payload.note !== undefined || !isUpdate) {
    nextPayload.note = String(payload.note || "").trim() || null;
  }

  const now = new Date();
  if (!isUpdate) {
    nextPayload.created_at = now;
  }
  nextPayload.updated_at = now;

  return nextPayload;
};

export const pricingRulesService = {
  async list(queryParams = {}) {
    const limit = toNumber(queryParams.limit, 100);
    const page = Math.max(1, toNumber(queryParams.page, 1));
    const offset = (page - 1) * limit;
    const active =
      queryParams.active === undefined ? undefined : String(queryParams.active).toLowerCase() === "true";

    const result = await pricingRulesRepository.list(
      {
        hotel_id: queryParams.hotel_id,
        room_type_id: queryParams.room_type_id,
        type: queryParams.type,
        active,
      },
      { limit, offset },
    );

    return {
      items: result.items.map(formatItem),
      pagination: {
        page,
        limit,
        total: result.total,
      },
    };
  },

  async getById(id) {
    const item = await pricingRulesRepository.getById(ensureValidId(id));
    if (!item) throw notFound("Pricing rule not found", "PRICING_RULE_NOT_FOUND");
    return formatItem(item);
  },

  async create(payload) {
    const created = await pricingRulesRepository.create(validatePayload(payload));
    return formatItem(created);
  },

  async update(id, payload) {
    const updated = await pricingRulesRepository.update(
      ensureValidId(id),
      validatePayload(payload, true),
    );
    if (!updated) throw notFound("Pricing rule not found", "PRICING_RULE_NOT_FOUND");
    return formatItem(updated);
  },

  async remove(id) {
    const removed = await pricingRulesRepository.remove(ensureValidId(id));
    if (!removed) throw notFound("Pricing rule not found", "PRICING_RULE_NOT_FOUND");
    return formatItem(removed);
  },
};
