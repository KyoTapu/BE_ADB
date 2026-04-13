import { pool } from "../../../../config/db.config.js";

const ensureRoleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS public.user_roles (
      user_id uuid PRIMARY KEY REFERENCES public."User"(user_id) ON DELETE CASCADE,
      role character varying NOT NULL DEFAULT 'client',
      updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await pool.query(query);
};

export const findUserByEmail = async (email) => {
  await ensureRoleTable();

  const query = `
    SELECT
      u.user_id::text AS id,
      u.full_name,
      u.email,
      u.phone,
      u.password_hash,
      u.is_active,
      u.is_banned,
      u.created_at,
      COALESCE(ur.role, 'client') AS role
    FROM public."User" u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

export const findUserById = async (userId) => {
  await ensureRoleTable();

  const query = `
    SELECT
      u.user_id::text AS id,
      u.full_name,
      u.email,
      u.phone,
      u.is_active,
      u.is_banned,
      u.created_at,
      COALESCE(ur.role, 'client') AS role
    FROM public."User" u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
    WHERE u.user_id::text = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || null;
};

export const createUser = async ({ fullName, email, phone, passwordHash }) => {
  await ensureRoleTable();

  const query = `
    INSERT INTO public."User" (full_name, email, phone, password_hash, is_active, is_banned)
    VALUES ($1, $2, $3, $4, true, false)
    RETURNING user_id::text AS id, full_name, email, phone, is_active, is_banned, created_at
  `;

  const { rows } = await pool.query(query, [fullName, email, phone, passwordHash]);
  const created = rows[0];

  await pool.query(
    `
      INSERT INTO public.user_roles (user_id, role, updated_at)
      VALUES ($1::uuid, 'client', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = CURRENT_TIMESTAMP
    `,
    [created.id]
  );

  return findUserById(created.id);
};

export const getStatus = async () => {
  const query = `
    SELECT
      user_id::text AS id,
      COALESCE(full_name, email, 'unknown') AS name,
      created_at,
      created_at AS updated_at
    FROM public."User"
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(query);

  if (rows.length > 0) {
    return rows[0];
  }

  const now = new Date().toISOString();
  return {
    id: null,
    name: "auth",
    created_at: now,
    updated_at: now,
  };
};

export const authRepository = {
  createUser,
  findUserByEmail,
  findUserById,
  getStatus,
};
