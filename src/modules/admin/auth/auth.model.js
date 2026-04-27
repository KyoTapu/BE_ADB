export const toAuthResponse = (record = {}) => ({
  id: record.id,
  name: record.name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const toLoginResponse = (record = {}) => ({
  accessToken: record.accessToken,
  tokenType: "Bearer",
  expiresIn: record.expiresIn,
  user: {
    id: record.user.id,
    email: record.user.email,
    fullName: record.user.fullName,
    role: record.user.role,
  },
});

export const toRoleUpdateResponse = (record = {}) => ({
  id: record.id,
  email: record.email,
  fullName: record.full_name,
  role: record.role,
  isActive: record.is_active,
  isBanned: record.is_banned,
  createdAt: record.created_at,
});

export const toAuthListResponse = (records = []) =>
  records.map((record) => toAuthResponse(record));
