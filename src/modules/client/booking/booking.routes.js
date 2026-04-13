import { Router } from "express";
import { getBookingStatus } from "./booking.controller.js";

const bookingRouter = Router();

bookingRouter.get("/health", getBookingStatus);

export default bookingRouter;
