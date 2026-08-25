import mongoose from "mongoose";

// Questions are embedded as a snapshot at generation time, so an exam's content
// never silently changes if the underlying bank question is later edited.
const examQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", default: null },
    type: String,
    text: String,
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: null },
    answer: String,
    explanation: String,
    marks: { type: Number, default: 1 },
    difficulty: String,
    source: { type: String, enum: ["bank", "ai"], default: "bank" },
    localId: { type: Number, required: true }, // stable per-exam id used by the frontend (Q1, Q2, ...)
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    name: String,
    questions: { type: [examQuestionSchema], default: [] },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    board: String,
    class: String,
    subject: String,
    chapter: String,
    topic: String,
    difficulty: String,
    bloomLevel: String,
    maxMarks: Number,
    timeAllowed: String,
    includeAnswers: { type: Boolean, default: true },
    instructions: { type: [String], default: [] },
    sections: { type: [sectionSchema], default: [] },
    generationStats: {
      requested: Number,
      fromBank: Number,
      fromAI: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
