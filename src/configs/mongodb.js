import { MongoClient } from "mongodb";
import { env } from "./env.js";

let clientPromise = null;

const mongoCollectionDefinitions = [
  {
    name: "pricing_rules",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["hotel_id", "room_type_id", "priority", "active", "conditions", "actions"],
        additionalProperties: true,
        properties: {
          hotel_id: { bsonType: "string" },
          room_type_id: { bsonType: "string" },
          priority: { bsonType: ["int", "long", "double", "decimal"] },
          active: { bsonType: "bool" },
          conditions: { bsonType: "object" },
          actions: { bsonType: "object" },
          created_at: { bsonType: ["date", "string", "null"] },
        },
      },
    },
    indexes: [
      {
        key: { hotel_id: 1, room_type_id: 1, active: 1, priority: 1 },
        name: "pricing_rules_lookup_idx",
      },
    ],
  },
  {
    name: "pricing_history",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["hotel_id", "room_type_id", "rate_date", "created_at"],
        additionalProperties: true,
        properties: {
          hotel_id: { bsonType: "string" },
          room_type_id: { bsonType: "string" },
          rate_date: { bsonType: ["date", "string"] },
          old_price: { bsonType: ["int", "long", "double", "decimal", "null"] },
          new_price: { bsonType: ["int", "long", "double", "decimal", "null"] },
          factors: { bsonType: ["object", "null"] },
          created_at: { bsonType: ["date", "string"] },
          booking_id: { bsonType: ["string", "null"] },
        },
      },
    },
    indexes: [
      {
        key: { hotel_id: 1, room_type_id: 1, rate_date: -1 },
        name: "pricing_history_lookup_idx",
      },
      {
        key: { booking_id: 1 },
        name: "pricing_history_booking_idx",
        sparse: true,
      },
    ],
  },
  {
    name: "occupancy_snapshots",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["hotel_id", "date", "occupancy_percent", "rooms_sold", "rooms_available"],
        additionalProperties: true,
        properties: {
          hotel_id: { bsonType: "string" },
          date: { bsonType: ["date", "string"] },
          occupancy_percent: { bsonType: ["int", "long", "double", "decimal"] },
          rooms_sold: { bsonType: ["int", "long", "double", "decimal"] },
          rooms_available: { bsonType: ["int", "long", "double", "decimal"] },
          created_at: { bsonType: ["date", "string", "null"] },
        },
      },
    },
    indexes: [
      {
        key: { hotel_id: 1, date: -1 },
        name: "occupancy_snapshots_lookup_idx",
        unique: true,
      },
    ],
  },
  {
    name: "search_logs",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["search_date", "checkin_date", "checkout_date", "guest_count", "created_at"],
        additionalProperties: true,
        properties: {
          hotel_id: { bsonType: ["string", "null"] },
          room_type_id: { bsonType: ["string", "null"] },
          search_date: { bsonType: ["date", "string"] },
          checkin_date: { bsonType: ["date", "string"] },
          checkout_date: { bsonType: ["date", "string"] },
          guest_count: { bsonType: ["int", "long", "double", "decimal"] },
          searched_room_type: { bsonType: ["string", "null"] },
          created_at: { bsonType: ["date", "string"] },
        },
      },
    },
    indexes: [
      {
        key: { hotel_id: 1, search_date: -1 },
        name: "search_logs_hotel_date_idx",
      },
      {
        key: { checkin_date: 1, checkout_date: 1, guest_count: 1 },
        name: "search_logs_search_window_idx",
      },
    ],
  },
];

const createClient = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  const client = new MongoClient(env.mongoUri);
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
  return client.db(env.mongoDbName);
};

export const getMongoCollection = async (name) => {
  const db = await getMongoDb();
  return db.collection(name);
};

export const checkMongoConnection = async () => {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
};

const ensureMongoCollection = async (db, definition) => {
  const existingCollections = await db.listCollections({ name: definition.name }).toArray();

  if (existingCollections.length === 0) {
    await db.createCollection(definition.name, {
      validator: definition.validator,
      validationLevel: "moderate",
    });
  } else {
    await db.command({
      collMod: definition.name,
      validator: definition.validator,
      validationLevel: "moderate",
    });
  }

  if (definition.indexes?.length) {
    await db.collection(definition.name).createIndexes(definition.indexes);
  }
};

export const ensureMongoSchema = async () => {
  const db = await getMongoDb();

  for (const definition of mongoCollectionDefinitions) {
    await ensureMongoCollection(db, definition);
  }

  return mongoCollectionDefinitions.map((definition) => definition.name);
};

export const mongoSchema = mongoCollectionDefinitions;
