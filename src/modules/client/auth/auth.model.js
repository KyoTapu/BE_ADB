export const toAuthResponse = (record = {}) => ({
  id: record.id,
  name: record.name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toClientAuthUser = (record = {}) => ({
  id: record.id,
  fullName: record.full_name,
  email: record.email,
  phone: record.phone,
  role: record.role,
  isActive: record.is_active,
  isBanned: record.is_banned,
  createdAt: record.created_at,
});

export const toLoginResponse = (record = {}) => ({
  accessToken: record.accessToken,
  tokenType: "Bearer",
  expiresIn: record.expiresIn,
  user: toClientAuthUser(record.user),
});

export const toAuthListResponse = (records = []) =>
  records.map((record) => toAuthResponse(record));
