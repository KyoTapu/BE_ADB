import { toSpecificDatePricingListResponse, toSpecificDatePricingResponse } from "../pricing/pricing.model.js";

export const toSpecificpricingStatusResponse = (record = {}) => ({
  status: record.status || "ok",
  total: Number(record.total) || 0,
});

export { toSpecificDatePricingResponse as toSpecificpricingResponse };
export { toSpecificDatePricingListResponse as toSpecificpricingListResponse };
