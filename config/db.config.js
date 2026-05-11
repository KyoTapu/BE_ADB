import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const checkDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("✅ Supabase DB connected successfully");
  } finally {
    client.release();
  }
};
