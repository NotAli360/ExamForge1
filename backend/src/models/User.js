import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    board: { type: String, default: "CBSE" },
    class: { type: String, default: "9" },
    roll: { type: String, default: "" },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null }, // "YYYY-MM-DD"
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
