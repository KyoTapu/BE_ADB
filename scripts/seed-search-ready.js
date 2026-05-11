import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { withTransaction } from "../src/configs/postgres.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.resolve(__dirname, "../database/seed_search_ready.sql");

const run = async () => {
  const sql = await readFile(seedFilePath, "utf8");

  if (!sql.trim()) {
    throw new Error(`Seed file is empty: ${seedFilePath}`);
  }

  await withTransaction(async (client) => {
    await client.query(sql);
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        seedFilePath,
        message: "Search-ready seed has been applied successfully.",
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
