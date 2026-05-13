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

    const subject = `Xác nhận thanh toán thành công - ${payload.bookingNumber || "Booking"}`;
    const customerName = String(payload.customerName || "Quý khách").trim();
    const facilities = Array.isArray(payload.facilities) ? payload.facilities : [];
    const facilityRows = facilities.length
      ? facilities
          .map(
            (facility) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${facility.name || "Dịch vụ"}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${facility.quantity || 1}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(facility.unitPrice)} ${payload.currency || "VND"}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(facility.totalPrice)} ${payload.currency || "VND"}</td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="4" style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Không có dịch vụ cộng thêm</td>
          </tr>
        `;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937;max-width:760px;margin:0 auto">
        <h2 style="margin-bottom:4px">HÓA ĐƠN THANH TOÁN ĐIỆN TỬ</h2>
        <div style="font-size:13px;color:#6b7280;margin-bottom:14px">Ngày phát hành: ${formatDate(new Date())}</div>
        <p>Xin chào ${customerName},</p>
        <p>Khách sạn đã ghi nhận thanh toán thành công cho đơn đặt phòng của bạn.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0 16px 0;border:1px solid #e5e7eb">
          <tr><td style="padding:8px;background:#f9fafb;width:220px">Mã booking</td><td style="padding:8px"><b>${payload.bookingNumber || "N/A"}</b></td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Khách sạn</td><td style="padding:8px">${payload.hotelName || "N/A"}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Loại phòng</td><td style="padding:8px">${payload.roomTypeName || "N/A"}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Nhận phòng</td><td style="padding:8px">${formatDate(payload.checkinDate)}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Trả phòng</td><td style="padding:8px">${formatDate(payload.checkoutDate)}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Phương thức thanh toán</td><td style="padding:8px">${String(payload.paymentMethod || "").toUpperCase()}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb">Mã giao dịch</td><td style="padding:8px">${payload.transactionId || "N/A"}</td></tr>
        </table>

        <h3 style="margin:0 0 8px 0">Chi tiết dịch vụ</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #e5e7eb">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">Hạng mục</th>
              <th style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">SL</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">Đơn giá</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb">Tiền phòng (${payload.roomTypeName || "Room"})</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">1</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(payload.subtotalAmount)} ${payload.currency || "VND"}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(payload.subtotalAmount)} ${payload.currency || "VND"}</td>
            </tr>
            ${facilityRows}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
          <tr><td style="padding:4px 0">Tạm tính</td><td style="padding:4px 0;text-align:right">${formatMoney(payload.subtotalAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:4px 0">Giảm giá</td><td style="padding:4px 0;text-align:right">-${formatMoney(payload.discountAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:4px 0">Thuế</td><td style="padding:4px 0;text-align:right">${formatMoney(payload.taxAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:4px 0">Phí dịch vụ</td><td style="padding:4px 0;text-align:right">${formatMoney(payload.serviceChargeAmount)} ${payload.currency || "VND"}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;border-top:1px solid #e5e7eb">Tổng thanh toán</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #e5e7eb">${formatMoney(payload.amount)} ${payload.currency || "VND"}</td></tr>
        </table>
        <p>Cảm ơn bạn đã đặt phòng. Hẹn gặp bạn tại khách sạn.</p>
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
