export const amenitiesModel = {
  moduleName: "amenities",
  tableName: "public.amenities",
  primaryKey: "id",
  routePath: "/api/amenities",
  defaultOrderBy: "created_at",
  filterableFields: ["id", "code", "name"],
  searchableFields: ["code", "name", "description", "icon"],
  createFields: ["code", "name", "icon", "description"],
  updateFields: ["code", "name", "icon", "description"],
};
