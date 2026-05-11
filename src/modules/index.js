import { authRoutes } from "./auth/auth.routes.js";
import { hotelsRoute } from "./hotels/hotels.routes.js";
import { roomTypesRoute } from "./room-types/room-types.routes.js";
import { roomsRoute } from "./rooms/rooms.routes.js";
import { amenitiesRoute } from "./amenities/amenities.routes.js";
import { facilitiesRoute } from "./facilities/facilities.routes.js";
import { ratePlansRoute } from "./rate-plans/rate-plans.routes.js";
import { dailyInventoryRoute } from "./daily-inventory/daily-inventory.routes.js";
import { dailyRatesRoute } from "./daily-rates/daily-rates.routes.js";
import { promotionsRoute } from "./promotions/promotions.routes.js";
import { paymentsRoute } from "./payments/payments.routes.js";
import { searchRoute } from "./search/search.routes.js";
import { pricingRoute } from "./pricing/pricing.routes.js";
import { pricingRulesRoute } from "./pricing-rules/pricing-rules.routes.js";
import { bookingRoutes } from "./bookings/bookings.routes.js";

export const modules = [
  ...authRoutes,
  hotelsRoute,
  roomTypesRoute,
  roomsRoute,
  amenitiesRoute,
  facilitiesRoute,
  ratePlansRoute,
  dailyInventoryRoute,
  dailyRatesRoute,
  promotionsRoute,
  paymentsRoute,
  searchRoute,
  pricingRoute,
  pricingRulesRoute,
  ...bookingRoutes,
];
