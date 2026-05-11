export const bookingsModel = {
  moduleName: "bookings",
  routePath: "/api/bookings",
  tableName: "public.bookings",
  primaryKey: "id",
  filterableFields: ["id", "hotel_id", "customer_id", "booking_status", "payment_status", "source_channel"],
  searchableFields: ["booking_number"],
  updateFields: [
    "booking_status",
    "payment_status",
    "source_channel",
    "subtotal_amount",
    "discount_amount",
    "tax_amount",
    "service_charge_amount",
    "final_amount",
    "currency",
  ],
};
