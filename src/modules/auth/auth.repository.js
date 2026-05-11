import { randomUUID } from "crypto";
import { query } from "../../configs/postgres.js";

const ensureUserTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS public."user" (
      user_id uuid PRIMARY KEY,
      full_name character varying,
      email character varying UNIQUE,
      phone character varying,
      password_hash text,
      is_active boolean NOT NULL DEFAULT true,
      is_banned boolean NOT NULL DEFAULT false,
      created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureRoleTable = async () => {
  await ensureUserTable();

  await query(`
    CREATE TABLE IF NOT EXISTS public.user_roles (
      user_id uuid PRIMARY KEY REFERENCES public."user"(user_id) ON DELETE CASCADE,
      role character varying NOT NULL DEFAULT 'client',
      updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const authRepository = {
  async getStatus() {
    const { rows } = await query(`
      SELECT
        user_id::text AS id,
        COALESCE(full_name, email, 'unknown') AS name,
        created_at,
        created_at AS updated_at
      FROM public."user"
      ORDER BY created_at DESC
      LIMIT 1
    `);

    return (
      rows[0] || {
        id: null,
        name: "auth",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  },

  async findUserByEmail(email) {
    await ensureRoleTable();

    const { rows } = await query(
      `
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
        FROM public."user" u
        LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    return rows[0] || null;
  },

  async findUserById(userId) {
    await ensureRoleTable();

    const { rows } = await query(
      `
        SELECT
          u.user_id::text AS id,
          u.full_name,
          u.email,
          u.phone,
          u.is_active,
          u.is_banned,
          u.created_at,
          COALESCE(ur.role, 'client') AS role
        FROM public."user" u
        LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
        WHERE u.user_id::text = $1
        LIMIT 1
      `,
      [userId],
    );

    return rows[0] || null;
  },

  async createUser({ fullName, email, phone, passwordHash }) {
    await ensureRoleTable();

    const userId = randomUUID();
    const { rows } = await query(
      `
        INSERT INTO public."user" (user_id, full_name, email, phone, password_hash, is_active, is_banned)
        VALUES ($1::uuid, $2, $3, $4, $5, true, false)
        RETURNING user_id::text AS id, full_name, email, phone, is_active, is_banned, created_at
      `,
      [userId, fullName, email, phone, passwordHash],
    );

    await query(
      `
        INSERT INTO public.user_roles (user_id, role, updated_at)
        VALUES ($1::uuid, 'client', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
      `,
      [rows[0].id],
    );

    return this.findUserById(rows[0].id);
  },

  async setUserRole(userId, role) {
    await ensureRoleTable();

    const existingUser = await this.findUserById(userId);
    if (!existingUser) {
      return null;
    }

    await query(
      `
        INSERT INTO public.user_roles (user_id, role, updated_at)
        VALUES ($1::uuid, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
      `,
      [userId, role],
    );

    return this.findUserById(userId);
  },
};
