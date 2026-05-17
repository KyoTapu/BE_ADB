import nodemailer from "nodemailer";
import { env } from "../../configs/env.js";

const isMailConfigured = () =>
  Boolean(
    env.smtpHost &&
      env.smtpPort &&
      env.smtpFromEmail &&
      env.smtpUser &&
      (env.smtpPass || (env.smtpOauthClientId && env.smtpOauthClientSecret && env.smtpOauthRefreshToken)),
  );

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpPass
      ? {
          user: env.smtpUser,
          pass: env.smtpPass,
        }
      : {
          type: "OAuth2",
          user: env.smtpUser,
          clientId: env.smtpOauthClientId,
          clientSecret: env.smtpOauthClientSecret,
          refreshToken: env.smtpOauthRefreshToken,
          accessToken: env.smtpOauthAccessToken || undefined,
        },
  });

  return transporter;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("vi-VN");
};

const formatMoney = (value) => Number(value || 0).toLocaleString("vi-VN");

export const mailService = {
  isConfigured: isMailConfigured,

  async sendPaymentSuccessEmail(payload = {}) {
    if (!isMailConfigured()) {
      return { skipped: true, reason: "MAIL_NOT_CONFIGURED" };
    }

    const to = String(payload.customerEmail || "").trim();
    if (!to) {
      return { skipped: true, reason: "MISSING_CUSTOMER_EMAIL" };
    }

    const subject = `Payment confirmed - ${payload.bookingNumber || "Booking"}`;
    const customerName = String(payload.customerName || "Guest").trim();
    const facilities = Array.isArray(payload.facilities) ? payload.facilities : [];
    const facilityRows = facilities.length
      ? facilities
          .map(
            (facility) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${facility.name || "Service"}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${facility.quantity || 1}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(facility.unitPrice)} ${payload.currency || "VND"}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(facility.totalPrice)} ${payload.currency || "VND"}</td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="4" style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">No add-on services</td>
          </tr>
        `;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937;max-width:760px;margin:0 auto">
        <h2 style="margin-bottom:4px">ELECTRONIC PAYMENT INVOICE</h2>
        <div style="font-size:13px;color:#6b7280;margin-bottom:14px">Issue date: ${formatDate(new Date())}</div>
        <p>Hello ${customerName},</p>
        <p>The hotel has recorded successful payment for your booking.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0 16px 0;border:1px solid #e5e7eb">
          <tr><td style="padding:8px;background:#f9fafb;width:220px">Booking code</td><td style="padding:8px"><b>${payload.bookingNumber || "N/A"}</b></td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Hotel</td><td style="padding:8px">${payload.hotelName || "N/A"}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Room type</td><td style="padding:8px">${payload.roomTypeName || "N/A"}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Check-in</td><td style="padding:8px">${formatDate(payload.checkinDate)}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Check-out</td><td style="padding:8px">${formatDate(payload.checkoutDate)}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Payment method</td><td style="padding:8px">${String(payload.paymentMethod || "").toUpperCase()}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Transaction ID</td><td style="padding:8px">${payload.transactionId || "N/A"}</td></tr>
        </table>

        <h3 style="margin:0 0 8px 0">Service details</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #e5e7eb">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">Item</th>
              <th style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">SL</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">Unit price</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb">Room charge (${payload.roomTypeName || "Room"})</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">1</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(payload.subtotalAmount)} ${payload.currency || "VND"}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(payload.subtotalAmount)} ${payload.currency || "VND"}</td>
            </tr>
            ${facilityRows}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
          <tr><td style="padding:4px 0">Subtotal</td><td style="padding:4px 0;text-align:right">${formatMoney(payload.subtotalAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:4px 0">Discount</td><td style="padding:4px 0;text-align:right">-${formatMoney(payload.discountAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:4px 0">Tax</td><td style="padding:4px 0;text-align:right">${formatMoney(payload.taxAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:4px 0">Service charge</td><td style="padding:4px 0;text-align:right">${formatMoney(payload.serviceChargeAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;border-top:1px solid #e5e7eb">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #e5e7eb">${formatMoney(payload.amount)} ${payload.currency || "VND"}</td></tr>
        </table>
        <p>Thank you for your booking. We look forward to welcoming you.</p>
      </div>
    `;

    await getTransporter().sendMail({
      from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
      to,
      subject,
      html,
    });

    return { skipped: false };
  },
};

