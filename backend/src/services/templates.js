// Each template describes exactly what shape the LLM must return for a given
// question type, and the marks/format rules the validator will later enforce.
// Keeping these centralized means both the prompt builder and the validator
// stay in sync.

export const TEMPLATES = {
  mcq: {
    marks: 1,
    label: "Multiple Choice Question",
    schemaHint:
      '{ "type":"mcq", "text": string, "options": [4 strings, prefixed "A) ".."D) "], "correctIndex": 0-3, "answer": string (must equal options[correctIndex]), "explanation": string }',
    rules: "Exactly 4 options, exactly one correct option, options must be plausible distractors (no obviously silly ones).",
  },
  fill_blank: {
    marks: 1,
    label: "Fill in the Blank",
    schemaHint:
      '{ "type":"fill_blank", "text": string (contains a "______" blank), "options": [], "correctIndex": null, "answer": string, "explanation": string }',
    rules: "Exactly one blank in the text, answer is a short phrase (<=6 words).",
  },
  true_false: {
    marks: 1,
    label: "True / False",
    schemaHint:
      '{ "type":"true_false", "text": string (a statement), "options": ["True","False"], "correctIndex": 0 or 1, "answer": "True" or "False", "explanation": string }',
    rules: "Statement must be unambiguously true or false based on the syllabus.",
  },
  very_short: {
    marks: 1,
    label: "Very Short Answer",
    schemaHint:
      '{ "type":"very_short", "text": string, "options": [], "correctIndex": null, "answer": string (<=15 words), "explanation": string }',
    rules: "Answerable in one line / one term.",
  },
  short: {
    marks: 3,
    label: "Short Answer",
    schemaHint:
      '{ "type":"short", "text": string, "options": [], "correctIndex": null, "answer": string (2-4 sentences), "explanation": string }',
    rules: "Requires a 2-3 sentence explanation-style answer, not a single word.",
  },
  long: {
    marks: 5,
    label: "Long Answer",
    schemaHint:
      '{ "type":"long", "text": string, "options": [], "correctIndex": null, "answer": string (structured, multi-point), "explanation": string }',
    rules: "Multi-part or descriptive question requiring a detailed, structured answer.",
  },
  assertion: {
    marks: 1,
    label: "Assertion-Reason",
    schemaHint:
      '{ "type":"assertion", "text": string in the form "Assertion (A): ...\\nReason (R): ...", "options": [4 standard A/R options], "correctIndex": 0-3, "answer": string, "explanation": string }',
    rules:
      'Options must always be exactly: "A) Both A and R are true and R is the correct explanation of A.", "B) Both A and R are true but R is not the correct explanation of A.", "C) A is true but R is false.", "D) A is false but R is true."',
  },
  case: {
    marks: 4,
    label: "Case-Based / Competency Question",
    schemaHint:
      '{ "type":"case", "text": string ("Read the passage:\\n<passage>\\nQuestion: <question>"), "options": [4 strings], "correctIndex": 0-3, "answer": string, "explanation": string }',
    rules: "Passage must be syllabus-accurate and 2-4 sentences; question must be answerable from the passage plus basic chapter knowledge.",
  },
};

export function marksForType(type) {
  return TEMPLATES[type]?.marks ?? 1;
}

export function sectionNameForType(type) {
  switch (type) {
    case "mcq":
    case "assertion":
    case "true_false":
    case "fill_blank":
      return "SECTION A - Objective & Assertion-Reason (1 Mark Each)";
    case "very_short":
    case "short":
      return "SECTION B - Short Answer Questions (2-3 Marks Each)";
    case "long":
      return "SECTION C - Long Answer & HOTS (5 Marks Each)";
    case "case":
      return "SECTION D - Case-Based Competency Question (4 Marks)";
    default:
      return "SECTION A - Objective (1 Mark Each)";
  }
}
