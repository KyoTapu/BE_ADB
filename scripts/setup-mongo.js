import { ensureMongoSchema, getMongoClient, getMongoDb } from "../src/configs/mongodb.js";

const run = async () => {
  const collections = await ensureMongoSchema();
  const db = await getMongoDb();
  const details = [];

  for (const name of collections) {
    const indexes = await db.collection(name).indexes();
    details.push({
      name,
      indexes: indexes.map((index) => index.name),
    });
  }

  console.log(JSON.stringify({ collections: details }, null, 2));

  const client = await getMongoClient();
  await client.close();
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
