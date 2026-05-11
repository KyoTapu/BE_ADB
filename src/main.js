import app from "../app.js";
import { env } from "./configs/env.js";
import { connectPlatforms } from "./configs/connections.js";

const startServer = async () => {
  try {
    const platformStatus = await connectPlatforms();
    console.log("Platform status:", platformStatus);

    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);

    if (error?.code === "ENOTFOUND" || error?.code === "ENOENT") {
      console.error(
        "Database host could not be resolved. If you are using Supabase direct host, switch .env to SUPABASE_POOLER_URL.",
      );
    }

    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  process.exit(0);
});

startServer();
