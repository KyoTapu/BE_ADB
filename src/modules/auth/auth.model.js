import { signAccessToken } from "../../common/jwt.js";

export const toAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  phone: user.phone,
  role: user.role || "client",
  isActive: user.is_active,
  isBanned: user.is_banned,
  createdAt: user.created_at,
});

export const toLoginResponse = (user) => ({
  accessToken: signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role || "client",
  }),
  expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  user: toAuthUser(user),
});
