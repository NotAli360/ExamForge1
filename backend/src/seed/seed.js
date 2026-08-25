import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  await connectDB();

  const filePath = path.join(__dirname, "data", "questions.json");
  const questions = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log(`[seed] clearing existing bank questions...`);
  await Question.deleteMany({ source: "bank" });

  console.log(`[seed] inserting ${questions.length} verified bank questions...`);
  await Question.insertMany(questions);

  console.log("[seed] done.");
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
