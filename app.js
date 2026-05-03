import express from "express";
import { sendError } from "./src/common/response.js";
import { authRouter as adminAuthRouter } from "./src/modules/admin/auth/index.js";
import { amenitiesRouter } from "./src/modules/admin/amenities/index.js";
import { facilitiesRouter } from "./src/modules/admin/facilities/index.js";
import { userRouter as adminUserRouter } from "./src/modules/admin/user/index.js";
import { authRouter as clientAuthRouter } from "./src/modules/client/auth/index.js";
import { bookingRouter } from "./src/modules/client/booking/index.js";
import { paymentRouter } from "./src/modules/client/payment/index.js";

import { hotelsRouter as adminHotelsRouter } from "./src/modules/admin/hotels/index.js";
import { pricingRouter as adminPricingRouter } from "./src/modules/admin/pricing/index.js";
import { hotelsRouter as clientHotelsRouter } from "./src/modules/client/hotels/index.js";
import { roomRouter as adminRoomRouter } from "./src/modules/admin/room/index.js";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

if (process.env.URL) {
  allowedOrigins.add(process.env.URL);
}

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/hotels", adminHotelsRouter);
app.use("/api/admin/room-type", adminRoomRouter);
app.use("/api/admin/amenities", amenitiesRouter);
app.use("/api/admin/facilities", facilitiesRouter);
app.use("/api/admin/pricing", adminPricingRouter);

app.use("/api/client/hotels", clientHotelsRouter);

app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/client/auth", clientAuthRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/payment", paymentRouter);

app.use("/", (req, res) => {
  res.json({
    message: "hello",
  });
});

app.use((error, req, res, next) => {
  return sendError(res, error);
});

export default app;
