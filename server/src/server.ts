import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, closeDB } from "./loaders/db.js";
import "./models/Association.js";

const app = createApp();

let server: ReturnType<typeof app.listen> | undefined;

(async () => {
  try {
    await connectDB({ sync: env.NODE_ENV !== "production" });

    server = app.listen(env.PORT, () => {
      console.log(`Running on ${env.PORT} (${env.NODE_ENV})`);
    });
    
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down...`);
  try {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await closeDB();
    console.log("Shutdown complete.");
    process.exit(0);
  } catch (e) {
    console.error("Shutdown error:", e);
    process.exit(1);
  }
}

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig as NodeJS.Signals, () => void shutdown(sig));
});
