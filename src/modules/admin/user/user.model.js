export const toUserResponse = (record = {}) => ({
  id: record.id,
  email: record.email,
  fullName: record.full_name,
  role: record.role,
  status: record.status,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toUserListResponse = (records = []) =>
  records.map((record) => toUserResponse(record));
