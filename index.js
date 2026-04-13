import app from "./app.js";
import dotenv from "dotenv";
import { checkDatabaseConnection } from "./config/db.config.js";

dotenv.config();
const PORT = Number(process.env.PORT)

const startServer = async () => {
  try {
    await checkDatabaseConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect database:", error.message);
    process.exit(1);
  }
};

startServer();
