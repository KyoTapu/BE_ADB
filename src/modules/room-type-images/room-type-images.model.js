export const roomTypeImagesModel = {
  moduleName: "room-type-images",
  tableName: "public.room_type_images",
  primaryKey: "id",
  routePath: "/api/room-type-images",
  defaultOrderBy: "created_at",
  filterableFields: ["id", "room_type_id", "is_cover"],
  searchableFields: ["image_url", "alt_text"],
  createFields: ["room_type_id", "image_url", "sort_order", "is_cover", "alt_text"],
  updateFields: ["room_type_id", "image_url", "sort_order", "is_cover", "alt_text"],
};
