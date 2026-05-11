import { badRequest, notFound } from "../../common/errors.js";
import { getMongoCollection } from "../../configs/mongodb.js";
import { enumerateStayDates, getLosDiscount, getOccupancyFactor, getWeekendFactor } from "./pricing.model.js";
import { pricingRepository } from "./pricing.repository.js";

const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundCurrency = (value) => Math.round(Number(value || 0));
const formatLocalDate = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateText = (value) => {
  if (!value) return "";
  if (value instanceof Date) {
    return formatLocalDate(value);
  }

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : formatLocalDate(parsed);
};

const getDayCode = (value) => WEEKDAY_CODES[new Date(normalizeDateText(value)).getUTCDay()];

const compareDateText = (left, right) => String(left || "").localeCompare(String(right || ""));

const calculateLeadDays = (checkIn) => {
  const currentDate = new Date();
  currentDate.setUTCHours(0, 0, 0, 0);

  const targetDate = new Date(checkIn);
  targetDate.setUTCHours(0, 0, 0, 0);

  return Math.floor((targetDate.getTime() - currentDate.getTime()) / 86400000);
};

const matchesRuleConditions = (rule = {}, date, context = {}) => {
  const conditions = rule.conditions || {};
  const type = String(rule.type || "").trim();

  if (type === "single_day" && conditions.date && String(conditions.date) !== String(date)) {
    return false;
  }

  if (type === "date_range") {
    if (conditions.start_date && compareDateText(date, conditions.start_date) < 0) return false;
    if (conditions.end_date && compareDateText(date, conditions.end_date) > 0) return false;
  }

  if (conditions.date && String(conditions.date) !== String(date)) return false;
  if (conditions.start_date && compareDateText(date, conditions.start_date) < 0) return false;
  if (conditions.end_date && compareDateText(date, conditions.end_date) > 0) return false;

  if (Array.isArray(conditions.day_of_week) && conditions.day_of_week.length) {
    const allowedDayCodes = conditions.day_of_week.map((item) => String(item).trim().toUpperCase());
    if (!allowedDayCodes.includes(getDayCode(date))) {
      return false;
    }
  }

  if (conditions.occupancy_gte !== undefined && toNumber(context.occupancyPercent) < toNumber(conditions.occupancy_gte)) {
    return false;
  }

  if (conditions.occupancy_lte !== undefined && toNumber(context.occupancyPercent) > toNumber(conditions.occupancy_lte)) {
    return false;
  }

  if (
    conditions.days_before_checkin_lte !== undefined &&
    toNumber(context.leadDays) > toNumber(conditions.days_before_checkin_lte)
  ) {
    return false;
  }

  if (
    conditions.days_before_checkin_gte !== undefined &&
    toNumber(context.leadDays) < toNumber(conditions.days_before_checkin_gte)
  ) {
    return false;
  }

  if (conditions.min_nights !== undefined && toNumber(context.nightCount) < toNumber(conditions.min_nights)) {
    return false;
  }

  if (conditions.max_nights !== undefined && toNumber(context.nightCount) > toNumber(conditions.max_nights)) {
    return false;
  }

  return true;
};

const applyRuleActions = (currentRate, rule = {}) => {
  const actions = rule.actions || {};
  const steps = [];
  let nextRate = Number(currentRate || 0);

  if (actions.final_rate !== undefined) {
    nextRate = toNumber(actions.final_rate, nextRate);
    steps.push(`fixed ${roundCurrency(nextRate)}`);
  }

  if (actions.fixed_rate !== undefined) {
    nextRate = toNumber(actions.fixed_rate, nextRate);
    steps.push(`fixed ${roundCurrency(nextRate)}`);
  }

  if (actions.multiplier !== undefined) {
    nextRate *= toNumber(actions.multiplier, 1);
    steps.push(`x${toNumber(actions.multiplier, 1)}`);
  }

  if (actions.increase_percent !== undefined) {
    const percent = toNumber(actions.increase_percent, 0);
    nextRate *= 1 + percent / 100;
    steps.push(`+${percent}%`);
  }

  if (actions.decrease_percent !== undefined) {
    const percent = toNumber(actions.decrease_percent, 0);
    nextRate *= 1 - percent / 100;
    steps.push(`-${percent}%`);
  }

  if (actions.add_amount !== undefined) {
    const amount = toNumber(actions.add_amount, 0);
    nextRate += amount;
    steps.push(`+${roundCurrency(amount)}`);
  }

  if (actions.delta_amount !== undefined) {
    const amount = toNumber(actions.delta_amount, 0);
    nextRate += amount;
    steps.push(`${amount >= 0 ? "+" : ""}${roundCurrency(amount)}`);
  }

  if (actions.min_rate !== undefined) {
    nextRate = Math.max(nextRate, toNumber(actions.min_rate, nextRate));
    steps.push(`min ${roundCurrency(actions.min_rate)}`);
  }

  if (actions.max_rate !== undefined) {
    nextRate = Math.min(nextRate, toNumber(actions.max_rate, nextRate));
    steps.push(`max ${roundCurrency(actions.max_rate)}`);
  }

  return {
    adjustedRate: roundCurrency(nextRate),
    actionSummary: steps.join(" · ") || "matched",
  };
};

const buildPricingAdjustments = (nightlyRates = [], pricingRules = [], context = {}) => {
  const appliedRuleMap = new Map();

  const nightlyBreakdown = nightlyRates.map((night) => {
    const rateDate = normalizeDateText(night.rate_date);
    const baseRate = roundCurrency(night.final_rate || night.base_rate || 0);
    let adjustedRate = baseRate;
    const appliedRules = [];

    for (const rule of pricingRules) {
      if (!matchesRuleConditions(rule, rateDate, context)) {
        continue;
      }

      const previousRate = adjustedRate;
      const result = applyRuleActions(adjustedRate, rule);
      adjustedRate = result.adjustedRate;
      const impactAmount = roundCurrency(adjustedRate - previousRate);

      if (!impactAmount && !result.actionSummary) {
        continue;
      }

      const appliedRule = {
        ruleId: String(rule.id || rule._id || ""),
        name: rule.name || rule.note || rule.type || "pricing rule",
        type: rule.type || "custom",
        priority: toNumber(rule.priority, 100),
        actionSummary: result.actionSummary,
        impactAmount,
      };

      appliedRules.push(appliedRule);

      const aggregate = appliedRuleMap.get(appliedRule.ruleId) || {
        ...appliedRule,
        impactAmount: 0,
        matchedDates: [],
        nightsApplied: 0,
      };

      aggregate.impactAmount += impactAmount;
      aggregate.nightsApplied += 1;
      aggregate.matchedDates.push(rateDate);
      appliedRuleMap.set(appliedRule.ruleId, aggregate);
    }

    return {
      date: rateDate,
      baseRate,
      adjustedRate,
      impactAmount: roundCurrency(adjustedRate - baseRate),
      source: appliedRules.length ? "pricing_rule" : "daily_rate",
      appliedRules,
    };
  });

  return {
    nightlyBreakdown,
    appliedPricingRules: Array.from(appliedRuleMap.values()).sort((first, second) => first.priority - second.priority),
  };
};

export const pricingService = {
  async quote(payload = {}) {
    const roomTypeId = payload.roomTypeId;
    const ratePlanId = payload.ratePlanId || null;
    const checkIn = String(payload.checkIn || "").trim();
    const checkOut = String(payload.checkOut || "").trim();
    const facilityIds = Array.isArray(payload.facilityIds) ? payload.facilityIds : [];
    const promotionCode = String(payload.promotionCode || "").trim() || null;

    if (!roomTypeId || !checkIn || !checkOut) {
      throw badRequest("roomTypeId, checkIn and checkOut are required", "MISSING_PRICING_FIELDS");
    }

    const stayDates = enumerateStayDates(checkIn, checkOut);
    if (!stayDates.length) {
      throw badRequest("checkOut must be after checkIn", "INVALID_STAY_DATES");
    }

    const roomType = await pricingRepository.getRoomTypeContext(roomTypeId);
    if (!roomType) {
      throw notFound("Room type not found", "ROOM_TYPE_NOT_FOUND");
    }

    const [nightlyRates, facilities, promotion, taxRules] = await Promise.all([
      pricingRepository.getNightlyRates({ roomTypeId, ratePlanId, checkIn, checkOut }),
      pricingRepository.getFacilities(facilityIds),
      pricingRepository.getPromotion(promotionCode),
      pricingRepository.getTaxRules(roomType.country),
    ]);

    if (!nightlyRates.length) {
      throw notFound("No nightly rates found for the selected stay", "DAILY_RATE_NOT_FOUND");
    }

    let pricingRules = [];

    try {
      const collection = await getMongoCollection("pricing_rules");
      pricingRules = await collection
        .find({
          hotel_id: String(roomType.hotel_id),
          room_type_id: String(roomType.id),
          active: true,
        })
        .sort({ priority: 1 })
        .toArray();
    } catch (error) {
      console.warn("Pricing rules unavailable:", error.message);
    }

    const occupancyPercent = toNumber(payload.occupancyPercent, 0);
    const leadDays = calculateLeadDays(checkIn);
    const { nightlyBreakdown, appliedPricingRules } = buildPricingAdjustments(nightlyRates, pricingRules, {
      occupancyPercent,
      leadDays,
      nightCount: stayDates.length,
      stayDates,
    });

    const subtotal = nightlyBreakdown.reduce((sum, item) => sum + Number(item.adjustedRate || 0), 0);
    const facilityTotal = facilities.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
    const losDiscount = getLosDiscount(stayDates.length, subtotal);
    const promotionDiscount =
      promotion?.discount_type === "PERCENT"
        ? (subtotal * Number(promotion.discount_value || 0)) / 100
        : Number(promotion?.discount_value || 0);
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
    const taxableAmount = Math.max(subtotal - losDiscount - promotionDiscount + facilityTotal + serviceCharge, 0);
    const taxAmount = taxRules.reduce(
      (sum, rule) => sum + taxableAmount * (Number(rule.tax_percent || 0) / 100),
      0,
    );

    return {
      hotel: {
        id: roomType.hotel_id,
        name: roomType.hotel_name,
      },
      roomType: {
        id: roomType.id,
        name: roomType.name,
      },
      stayDates,
      nightlyRates,
      nightlyBreakdown,
      pricingRules,
      appliedPricingRules,
      factors: {
        occupancyFactor: getOccupancyFactor(occupancyPercent),
        weekendFactor: getWeekendFactor(stayDates),
        seasonFactor: 1,
        eventFactor: 1,
      },
      charges: {
        subtotal,
        losDiscount,
        promotionDiscount,
        facilityTotal,
        serviceCharge,
        taxAmount,
        finalAmount: Math.max(
          subtotal - losDiscount - promotionDiscount + facilityTotal + serviceCharge + taxAmount,
          0,
        ),
      },
      facilities,
      promotion,
    };
  },
};
