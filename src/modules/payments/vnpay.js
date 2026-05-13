import crypto from "crypto";
import { env } from "../../configs/env.js";

const pad = (value) => String(value).padStart(2, "0");

export const formatVnpDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
};

export const getVnpayConfig = () => {
  const returnUrl =
    env.vnpayReturnUrl || `${String(env.appUrl || "http://localhost:8000").replace(/\/+$/, "")}/api/payments/vnpay/return`;
  const ipnUrl =
    env.vnpayIpnUrl || `${String(env.appUrl || "http://localhost:8000").replace(/\/+$/, "")}/api/payments/vnpay/ipn`;

  return {
    tmnCode: env.vnpayTmnCode,
    hashSecret: env.vnpayHashSecret,
    paymentUrl: env.vnpayPaymentUrl,
    returnUrl,
    ipnUrl,
  };
};

export const isVnpayConfigured = () => {
  const config = getVnpayConfig();
  return Boolean(config.tmnCode && config.hashSecret && config.paymentUrl);
};

export const buildVnpHashData = (params = {}) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value)).replace(/%20/g, "+")}`,
    )
    .join("&");

export const signVnpParams = (params = {}) =>
  crypto.createHmac("sha512", getVnpayConfig().hashSecret).update(buildVnpHashData(params), "utf8").digest("hex");

export const buildVnpPaymentUrl = (params = {}) => {
  const config = getVnpayConfig();
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const query = new URLSearchParams();

  for (const [key, value] of sortedEntries) {
    query.set(key, String(value));
  }

  query.set("vnp_SecureHash", signVnpParams(params));
  return `${config.paymentUrl}?${query.toString()}`;
};

export const verifyVnpaySignature = (queryParams = {}) => {
  const normalized = { ...queryParams };
  const providedHash = normalized.vnp_SecureHash || "";
  delete normalized.vnp_SecureHash;
  delete normalized.vnp_SecureHashType;
  const expectedHash = signVnpParams(normalized);
  return {
    isValid: Boolean(providedHash) && expectedHash === providedHash,
    expectedHash,
    providedHash,
  };
};

export const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const rawIp =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers["x-real-ip"] ||
    "127.0.0.1";

  return String(rawIp).includes(":") ? "127.0.0.1" : String(rawIp);
};
