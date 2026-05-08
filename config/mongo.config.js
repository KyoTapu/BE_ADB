import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "hotel_booking";

let clientPromise = null;

const createClient = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  return client;
};

export const getMongoClient = async () => {
  if (!clientPromise) {
    clientPromise = createClient().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
};

export const getMongoDb = async () => {
  const client = await getMongoClient();
  return client.db(MONGO_DB_NAME);
};

export const checkMongoConnection = async () => {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  console.log(`✅ MongoDB connected successfully (${MONGO_DB_NAME})`);
};

export const mongoConfig = {
  uri: MONGO_URI,
  dbName: MONGO_DB_NAME,
};
