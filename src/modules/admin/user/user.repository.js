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
    FROM public."User"
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
    FROM public."User"
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query);
  return rows;
};

export const userRepository = {
  findById,
  findAll,
};
