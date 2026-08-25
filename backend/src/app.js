import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import examRoutes from "./routes/exam.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import questionRoutes from "./routes/question.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Never use wildcard CORS in production. Multiple allowed origins can be
// supplied as a comma-separated CORS_ORIGIN value.
const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: false,
}));

// Small baseline security headers without adding another dependency.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(express.json({ limit: "256kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/questions", questionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
