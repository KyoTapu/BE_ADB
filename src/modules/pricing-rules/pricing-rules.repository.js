import { ObjectId } from "mongodb";
import { getMongoCollection } from "../../configs/mongodb.js";

const COLLECTION_NAME = "pricing_rules";

const toObjectId = (id) => new ObjectId(String(id));

export const pricingRulesRepository = {
  async list(filters = {}, options = {}) {
    const collection = await getMongoCollection(COLLECTION_NAME);
    const query = {};

    if (filters.hotel_id) query.hotel_id = String(filters.hotel_id);
    if (filters.room_type_id) query.room_type_id = String(filters.room_type_id);
    if (filters.type) query.type = String(filters.type);
    if (filters.active !== undefined) query.active = Boolean(filters.active);

    const limit = Number(options.limit) > 0 ? Number(options.limit) : 100;
    const offset = Number(options.offset) >= 0 ? Number(options.offset) : 0;

    const [items, total] = await Promise.all([
      collection.find(query).sort({ priority: 1, created_at: -1 }).skip(offset).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);

    return { items, total, limit, offset };
  },

  async getById(id) {
    const collection = await getMongoCollection(COLLECTION_NAME);
    return collection.findOne({ _id: toObjectId(id) });
  },

  async create(payload) {
    const collection = await getMongoCollection(COLLECTION_NAME);
    const { insertedId } = await collection.insertOne(payload);
    return collection.findOne({ _id: insertedId });
  },

  async update(id, payload) {
    const collection = await getMongoCollection(COLLECTION_NAME);
    await collection.updateOne({ _id: toObjectId(id) }, { $set: payload });
    return collection.findOne({ _id: toObjectId(id) });
  },

  async remove(id) {
    const collection = await getMongoCollection(COLLECTION_NAME);
    const existing = await collection.findOne({ _id: toObjectId(id) });
    if (!existing) return null;
    await collection.deleteOne({ _id: toObjectId(id) });
    return existing;
  },
};
