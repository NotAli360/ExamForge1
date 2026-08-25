import mongoose from "mongoose";

export async function connectDB() {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017";
  const dbName = process.env.DB_NAME || "examforge";

  mongoose.connection.on("connected", () => {
    console.log(`[db] connected -> ${dbName}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err.message);
  });

  await mongoose.connect(url, { dbName });
  return mongoose.connection;
}
