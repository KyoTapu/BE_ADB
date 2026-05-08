import dotenv from "dotenv";
import { checkDatabaseConnection } from "../config/db.config.js";
import { checkMongoConnection } from "../config/mongo.config.js";
import { roomInventorySnapshotService } from "../src/modules/client/search/roomInventorySnapshot.service.js";

dotenv.config();

const horizonDays = Number(process.argv[2]) || 180;

const run = async () => {
  try {
    await checkDatabaseConnection();
    await checkMongoConnection();

    const result = await roomInventorySnapshotService.syncFromPostgres({ horizonDays });
    console.log("✅ room_inventory_daily synced");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to sync room inventory snapshot:", error);
    process.exit(1);
  }
};

run();
