import app from "./app.js";
import dotenv from "dotenv";

import { checkDatabaseConnection } from "./config/db.config.js";
import { checkMongoConnection } from "./config/mongo.config.js";
import { connectRedis } from "./config/redis.config.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {

    // PostgreSQL
    await checkDatabaseConnection();
    console.log("✅ PostgreSQL Connected");

    // MongoDB
    try {
      await checkMongoConnection();
      console.log("✅ MongoDB Connected");

    } catch (mongoError) {

      console.warn(
        "⚠️ MongoDB unavailable:",
        mongoError.message
      );
    }

    // Redis
    try {

      await connectRedis();

      console.log("✅ Redis Connected");

    } catch (redisError) {

      console.warn(
        "⚠️ Redis unavailable:",
        redisError.message
      );
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {

    console.error(
      "❌ Failed to connect PostgreSQL:",
      error.message
    );

    process.exit(1);
  }
};

process.on("SIGINT", async () => {

  console.log("🛑 Gracefully shutting down...");

  process.exit(0);

});

startServer();