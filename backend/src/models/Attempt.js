import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} }, // { localId: optionIndex }
    total: Number,
    attempted: Number,
    unattempted: Number,
    correct: Number,
    incorrect: Number,
    accuracy: String, // "80.0%"
    score: String, // "16/20"
    subject: String,
    chapter: String,
  },
  { timestamps: true }
);

export default mongoose.model("Attempt", attemptSchema);
