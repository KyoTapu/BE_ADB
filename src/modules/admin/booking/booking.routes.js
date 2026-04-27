import { Router } from "express";
import { getBookings, updateStatus } from "./booking.controller.js";
import { authenticate, authorize } from "../../../middlewares/auth.middleware.js";

const bookingRouter = Router();

bookingRouter.use(authenticate, authorize('admin'));

bookingRouter.get("/", getBookings);
bookingRouter.patch("/:id/status", updateStatus);

export default bookingRouter;