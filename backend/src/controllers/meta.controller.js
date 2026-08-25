const CLASSES = ["6", "7", "8", "9", "10", "11", "12"];
const SUBJECTS = ["Science", "Mathematics", "Social Science", "English", "Hindi"];

const CHAPTERS_BY_SUBJECT = {
  Science: ["Matter in Our Surroundings", "Tissues", "Motion", "Force and Laws of Motion", "Gravitation", "Sound"],
  Mathematics: ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Triangles"],
  "Social Science": ["The French Revolution", "Socialism in Europe", "Nazism and the Rise of Hitler", "Physical Features of India"],
  English: ["The Fun They Had", "The Sound of Music", "The Little Girl", "A Truly Beautiful Mind"],
  Hindi: ["\u0926\u0941\u0916 \u0915\u093e \u0905\u0927\u093f\u0915\u093e\u0930", "\u0938\u093e\u0925\u0940", "\u0909\u092a\u092d\u094b\u0915\u094d\u0924\u093e\u0913\u0902 \u0915\u093e \u0938\u0902\u0917\u094d\u0930\u0939\u0915\u0930\u094d\u0924\u093e"],
};

const BLOOMS_LEVELS = [
  "Remembering (Level 1)",
  "Understanding (Level 2)",
  "Applying (Level 3)",
  "Analyzing (Level 4)",
  "Evaluating (Level 5)",
  "Creating (Level 6)",
];

const QUESTION_TYPES_LIST = [
  { key: "mcq", label: "MCQs (Multiple Choice)" },
  { key: "short", label: "Short Answer (2-3 Marks)" },
  { key: "long", label: "Long Answer (5 Marks)" },
  { key: "assertion", label: "Assertion-Reason" },
  { key: "case", label: "Case-Based Passages" },
  { key: "very_short", label: "Very Short Answer" },
  { key: "fill_blank", label: "Fill in the Blanks" },
  { key: "true_false", label: "True / False" },
];

export function getMeta(req, res) {
  res.json({
    board: "CBSE",
    classes: CLASSES,
    subjects: SUBJECTS,
    chaptersBySubject: CHAPTERS_BY_SUBJECT,
    bloomsLevels: BLOOMS_LEVELS,
    difficulties: ["Easy", "Medium", "Hard"],
    questionTypesList: QUESTION_TYPES_LIST,
  });
}
