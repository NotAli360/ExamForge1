import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 8001;

async function start() {
  if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === "change-this-to-a-long-random-string")) {
    throw new Error("JWT_SECRET must be a strong server-side secret in production");
  }
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Exam Forge backend listening on :${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
