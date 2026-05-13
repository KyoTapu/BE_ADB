import { createCrudService } from "../../common/crud.js";
import { badRequest, notFound } from "../../common/errors.js";
import { env } from "../../configs/env.js";
import { bookingsRepository } from "../bookings/bookings.repository.js";
import { paymentsModel } from "./payments.model.js";
import { paymentsRepository } from "./payments.repository.js";
import {
  buildVnpPaymentUrl,
  formatVnpDate,
  getVnpayConfig,
  isVnpayConfigured,
  verifyVnpaySignature,
} from "./vnpay.js";

const crudService = createCrudService(paymentsRepository, paymentsModel);

const normalizePaymentStatus = (query = {}) => {
  if (query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00") {
    return "PAID";
  }

  if (query.vnp_ResponseCode === "24") {
    return "CANCELLED";
  }

  return "FAILED";
};

const normalizeBookingStatus = (paymentStatus) => {
  if (paymentStatus === "PAID") {
    return "CONFIRMED";
  }

  if (paymentStatus === "CANCELLED") {
    return "CANCELLED";
  }

  return "PENDING";
};

const processVnpayResult = async (query = {}, { allowAlreadyProcessed = false } = {}) => {
  const signature = verifyVnpaySignature(query);

  if (!signature.isValid) {
    throw badRequest("Invalid VNPay checksum", "VNPAY_INVALID_CHECKSUM");
  }

  const transactionId = String(query.vnp_TxnRef || "").trim();
  const payment = await paymentsRepository.getByTransactionId(transactionId);

  if (!payment) {
    throw notFound("Payment transaction not found", "PAYMENT_NOT_FOUND");
  }

  if (Number(payment.amount) !== Math.round((Number(query.vnp_Amount) || 0) / 100)) {
    throw badRequest("Invalid VNPay amount", "VNPAY_INVALID_AMOUNT");
  }

  const currentStatus = String(payment.payment_status || "").toUpperCase();
  if (currentStatus !== "PENDING") {
    if (allowAlreadyProcessed) {
      return {
        payment,
        paymentStatus: currentStatus,
        bookingStatus: normalizeBookingStatus(currentStatus),
        alreadyProcessed: true,
        signature,
      };
    }

    throw badRequest("Payment already processed", "PAYMENT_ALREADY_PROCESSED");
  }

  const nextPaymentStatus = normalizePaymentStatus(query);
  const nextBookingStatus = normalizeBookingStatus(nextPaymentStatus);

  const updatedPayment = await paymentsRepository.updatePaymentResultById(payment.id, {
    payment_status: nextPaymentStatus,
    paid_at: nextPaymentStatus === "PAID" ? new Date() : null,
  });

  await bookingsRepository.updateBookingPaymentState(payment.booking_id, {
    paymentStatus: nextPaymentStatus,
    bookingStatus: nextBookingStatus,
  });

  if (nextPaymentStatus !== "PAID") {
    await bookingsRepository.restoreInventoryForBooking(payment.booking_id);
  }

  return {
    payment: updatedPayment || payment,
    paymentStatus: nextPaymentStatus,
    bookingStatus: nextBookingStatus,
    alreadyProcessed: false,
    signature,
  };
};

export const paymentsService = {
  ...crudService,

  async createInternalPayment({ bookingId, amount, paymentMethod, bookingNumber }) {
    const normalizedMethod = String(paymentMethod || "pay_at_hotel").trim().toLowerCase();
    const provider = normalizedMethod === "vnpay" ? "vnpay" : "offline";
    const transactionId =
      normalizedMethod === "vnpay"
        ? `VNPAY-${String(bookingId).replace(/-/g, "").slice(0, 24)}`
        : `OFFLINE-${String(bookingId).replace(/-/g, "").slice(0, 24)}`;

    return paymentsRepository.createPayment({
      booking_id: bookingId,
      payment_method: normalizedMethod,
      provider,
      transaction_id: transactionId,
      amount: Number(amount) || 0,
      payment_status: normalizedMethod === "pay_at_hotel" ? "PENDING" : "PENDING",
      paid_at: null,
      booking_number: bookingNumber,
    });
  },

  async createVnpayPaymentUrl({ booking, payment, amount, ipAddress }) {
    if (!isVnpayConfigured()) {
      throw badRequest("VNPay is not configured", "VNPAY_NOT_CONFIGURED");
    }

    const config = getVnpayConfig();
    const params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: config.tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: payment.transaction_id,
      vnp_OrderInfo: `Thanh toan booking ${booking.booking_number}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(Number(amount || 0) * 100),
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: ipAddress || "127.0.0.1",
      vnp_CreateDate: formatVnpDate(),
    };

    return buildVnpPaymentUrl(params);
  },

  async getStatusByBookingId(bookingId) {
    const status = await paymentsRepository.getBookingPaymentStatus(bookingId);
    if (!status) {
      throw notFound("Payment status not found", "PAYMENT_STATUS_NOT_FOUND");
    }

    return status;
  },

  async handleVnpayIpn(query = {}) {
    try {
      await processVnpayResult(query);
      return {
        RspCode: "00",
        Message: "Confirm Success",
      };
    } catch (error) {
      if (error?.code === "VNPAY_INVALID_CHECKSUM") {
        return {
          RspCode: "97",
          Message: "Invalid checksum",
        };
      }

      if (error?.code === "PAYMENT_NOT_FOUND") {
        return {
          RspCode: "01",
          Message: "Order not found",
        };
      }

      if (error?.code === "VNPAY_INVALID_AMOUNT") {
        return {
          RspCode: "04",
          Message: "Invalid amount",
        };
      }

      if (error?.code === "PAYMENT_ALREADY_PROCESSED") {
        return {
          RspCode: "02",
          Message: "Order already processed",
        };
      }

      throw error;
    }
  },

  async buildVnpayReturnRedirect(query = {}) {
    let bookingId = "";
    let paymentId = "";
    let paymentStatus = "FAILED";
    let signatureValid = false;

    try {
      const result = await processVnpayResult(query, { allowAlreadyProcessed: true });
      bookingId = result.payment?.booking_id || "";
      paymentId = result.payment?.id || "";
      paymentStatus = result.paymentStatus || "FAILED";
      signatureValid = result.signature?.isValid === true;
    } catch (error) {
      const signature = verifyVnpaySignature(query);
      signatureValid = signature.isValid;
      paymentStatus = signature.isValid ? normalizePaymentStatus(query) : "FAILED";
      const transactionId = String(query.vnp_TxnRef || "").trim();
      const payment = transactionId ? await paymentsRepository.getByTransactionId(transactionId) : null;
      bookingId = payment?.booking_id || "";
      paymentId = payment?.id || "";
    }

    const redirectUrl = new URL(`${env.clientAppUrl.replace(/\/+$/, "")}/dat-phong/xac-nhan`);

    if (bookingId) {
      redirectUrl.searchParams.set("bookingId", bookingId);
    }

    if (paymentId) {
      redirectUrl.searchParams.set("paymentId", paymentId);
    }

    redirectUrl.searchParams.set("provider", "vnpay");
    redirectUrl.searchParams.set("method", "vnpay");
    redirectUrl.searchParams.set("status", paymentStatus);
    redirectUrl.searchParams.set("responseCode", String(query.vnp_ResponseCode || ""));
    redirectUrl.searchParams.set("signatureValid", signatureValid ? "1" : "0");

    return redirectUrl.toString();
  },
};
