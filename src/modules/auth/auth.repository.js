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

const ensureUserHotelAssignmentsTable = async () => {
  await ensureRoleTable();

  await query(`
    CREATE TABLE IF NOT EXISTS public.user_hotel_assignments (
      user_id uuid PRIMARY KEY REFERENCES public."user"(user_id) ON DELETE CASCADE,
      hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
      assigned_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const authRepository = {
  async listUsers() {
    await ensureUserHotelAssignmentsTable();

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
          COALESCE(ur.role, 'client') AS role,
          uha.hotel_id::text AS assigned_hotel_id
        FROM public."user" u
        LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
        LEFT JOIN public.user_hotel_assignments uha ON uha.user_id = u.user_id
        ORDER BY u.created_at DESC
      `,
    );

    return rows;
  },

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
    await ensureUserHotelAssignmentsTable();

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
          COALESCE(ur.role, 'client') AS role,
          uha.hotel_id::text AS assigned_hotel_id
        FROM public."user" u
        LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
        LEFT JOIN public.user_hotel_assignments uha ON uha.user_id = u.user_id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    return rows[0] || null;
  },

  async findUserById(userId) {
    await ensureUserHotelAssignmentsTable();

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
          COALESCE(ur.role, 'client') AS role,
          uha.hotel_id::text AS assigned_hotel_id
        FROM public."user" u
        LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
        LEFT JOIN public.user_hotel_assignments uha ON uha.user_id = u.user_id
        WHERE u.user_id::text = $1
        LIMIT 1
      `,
      [userId],
    );

    return rows[0] || null;
  },

  async createUser({ fullName, email, phone, passwordHash }) {
    await ensureUserHotelAssignmentsTable();

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
    await ensureUserHotelAssignmentsTable();

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

  async setUserHotelAssignment(userId, hotelId) {
    await ensureUserHotelAssignmentsTable();

    const existingUser = await this.findUserById(userId);
    if (!existingUser) {
      return null;
    }

    await query(
      `
        INSERT INTO public.user_hotel_assignments (user_id, hotel_id, assigned_at)
        VALUES ($1::uuid, $2::uuid, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET hotel_id = EXCLUDED.hotel_id, assigned_at = CURRENT_TIMESTAMP
      `,
      [userId, hotelId],
    );

    return this.findUserById(userId);
  },

  async removeUserHotelAssignment(userId) {
    await ensureUserHotelAssignmentsTable();

    await query(
      `
        DELETE FROM public.user_hotel_assignments
        WHERE user_id = $1::uuid
      `,
      [userId],
    );

    return this.findUserById(userId);
  },
};
