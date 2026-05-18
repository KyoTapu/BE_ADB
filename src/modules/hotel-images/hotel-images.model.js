export const hotelImagesModel = {
  moduleName: "hotel-images",
  tableName: "public.hotel_images",
  primaryKey: "id",
  routePath: "/api/hotel-images",
  defaultOrderBy: "created_at",
  filterableFields: ["id", "hotel_id", "is_cover"],
  searchableFields: ["image_url", "alt_text"],
  createFields: ["hotel_id", "image_url", "sort_order", "is_cover", "alt_text"],
  updateFields: ["hotel_id", "image_url", "sort_order", "is_cover", "alt_text"],
};
