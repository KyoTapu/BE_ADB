import { createHash } from "crypto";

export const searchModel = {
  moduleName: "search",
  routePath: "/api/search",
};

export const buildSearchCacheKey = (payload) =>
  "search:" + createHash("sha1").update(JSON.stringify(payload)).digest("hex");
