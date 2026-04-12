// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const toAuthResponse = (record = {}) => ({
  id: record.id,
  name: record.name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toAuthListResponse = (records = []) => records.map((record) => toAuthResponse(record));
