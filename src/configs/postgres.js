import pg from "pg";
import { env, isProduction } from "./env.js";

const { Pool } = pg;

let poolInstance = null;

const getPool = () => {
  if (!env.postgresUrl) {
    throw new Error("DATABASE_URL or SUPABASE_DB_URL must be configured");
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: env.postgresUrl,
      ssl: isProduction
        ? {
            rejectUnauthorized: false,
          }
        : false,
    });
  }

  return poolInstance;
};

export const pool = new Proxy(
  {},
  {
    get(_target, property) {
      return getPool()[property];
    },
  },
);

export const query = async (text, params = []) => {
  return getPool().query(text, params);
};

export const withTransaction = async (callback) => {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const checkDatabaseConnection = async () => {
  const client = await getPool().connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};
