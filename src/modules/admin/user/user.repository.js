import { pool } from "../../../../config/db.config.js";

export const findById = async (id) => {
  const query = `
    SELECT
      user_id::text AS id,
      full_name,
      email,
      phone,
      is_active,
      is_banned,
      CASE
        WHEN is_banned = true THEN 'banned'
        WHEN is_active = false THEN 'inactive'
        ELSE 'active'
      END AS status,
      created_at,
      created_at AS updated_at
    FROM public.user
    WHERE user_id::text = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

export const findAll = async () => {
  const query = `
    SELECT
      user_id::text AS id,
      full_name,
      email,
      phone,
      is_active,
      is_banned,
      CASE
        WHEN is_banned = true THEN 'banned'
        WHEN is_active = false THEN 'inactive'
        ELSE 'active'
      END AS status,
      created_at,
      created_at AS updated_at
    FROM public.user
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query);
  return rows;
};

export const findAllPaged = async ({ limit, offset }) => {
  const query = `
    SELECT
      user_id::text AS id,
      full_name,
      email,
      phone,
      is_active,
      is_banned,
      CASE
        WHEN is_banned = true THEN 'banned'
        WHEN is_active = false THEN 'inactive'
        ELSE 'active'
      END AS status,
      created_at,
      created_at AS updated_at
    FROM public.user
    ORDER BY created_at DESC
    LIMIT $1
    OFFSET $2
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM public.user
  `;

  const [listResult, countResult] = await Promise.all([
    pool.query(query, [limit, offset]),
    pool.query(countQuery),
  ]);

  return {
    rows: listResult.rows,
    totalItems: countResult.rows?.[0]?.total ?? 0,
  };
};

export const userRepository = {
  findById,
  findAll,
  findAllPaged,
};
