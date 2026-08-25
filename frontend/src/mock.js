// Fallback data shown briefly while the real /api/meta and /api/exams calls
// resolve, so the UI never renders empty. Everything here is replaced by
// live backend data as soon as it loads.

export const appStats = {
  papersGenerated: 128,
  questionsInBank: 4200,
  streakDays: 14,
};

export const defaultSubjects = ["Science", "Mathematics", "Social Science", "English", "Hindi"];

export const defaultClasses = ["6", "7", "8", "9", "10", "11", "12"];

export const chaptersBySubject = {
  Science: ["Matter in Our Surroundings", "Tissues", "Motion", "Force and Laws of Motion"],
  Mathematics: ["Number Systems", "Polynomials", "Coordinate Geometry"],
  "Social Science": ["The French Revolution", "Physical Features of India"],
  English: ["The Fun They Had", "The Sound of Music"],
  Hindi: ["\u0926\u0941\u0916 \u0915\u093e \u0905\u0927\u093f\u0915\u093e\u0930"],
};

export const bloomsLevels = [
  "Remembering (Level 1)",
  "Understanding (Level 2)",
  "Applying (Level 3)",
  "Analyzing (Level 4)",
  "Evaluating (Level 5)",
  "Creating (Level 6)",
];

export const questionTypesList = [
  { key: "mcq", label: "MCQs (Multiple Choice)" },
  { key: "short", label: "Short Answer (2-3 Marks)" },
  { key: "long", label: "Long Answer (5 Marks)" },
  { key: "assertion", label: "Assertion-Reason" },
  { key: "case", label: "Case-Based Passages" },
  { key: "very_short", label: "Very Short Answer" },
  { key: "fill_blank", label: "Fill in the Blanks" },
  { key: "true_false", label: "True / False" },
];

export const mockSampleQuestionPaper = {
  title: "EXAM FORGE AI - CBSE PRACTICE TEST 2026-27",
  subject: "Science (Code: 086)",
  class: "Class IX",
  chapter: "Chapter 6: Tissues",
  maxMarks: 40,
  timeAllowed: "1 Hour 15 Minutes",
  instructions: [
    "All questions are compulsory.",
    "The question paper consists of sections grouped by question type and marks.",
    "Internal choices are given in some questions.",
  ],
  sections: [],
};
