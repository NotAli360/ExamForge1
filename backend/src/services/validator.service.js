import { normalize } from "../models/Question.js";
import { TEMPLATES } from "./templates.js";

const NEEDS_OPTIONS = new Set(["mcq", "true_false", "assertion", "case"]);
const ASSERTION_OPTIONS = [
  "A) Both A and R are true and R is the correct explanation of A.",
  "B) Both A and R are true but R is not the correct explanation of A.",
  "C) A is true but R is false.",
  "D) A is false but R is true.",
];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sameText(a, b) {
  return normalize(a || "") === normalize(b || "");
}

/**
 * Strictly validates AI output before it can become an exam question.
 * The model is never trusted for structural correctness just because it
 * returned valid JSON.
 */
export function validateQuestion(q, { type, difficulty, usedTexts }) {
  const errors = [];

  if (!q || typeof q !== "object" || Array.isArray(q)) {
    return { valid: false, errors: ["not an object"] };
  }

  const text = clean(q.text);
  const answer = clean(q.answer);
  if (text.length < 8) errors.push("missing/too-short question text");
  if (!answer) errors.push("missing answer");

  if (q.type !== type) errors.push(`type mismatch: expected ${type}, got ${q.type || "missing"}`);
  if (q.difficulty && difficulty && q.difficulty !== difficulty) {
    errors.push(`difficulty mismatch: expected ${difficulty}, got ${q.difficulty}`);
  }

  const options = Array.isArray(q.options) ? q.options.map(clean) : [];

  if (NEEDS_OPTIONS.has(type)) {
    const expected = type === "true_false" ? 2 : 4;
    if (options.length !== expected || options.some((o) => !o)) {
      errors.push(`expected exactly ${expected} non-empty options`);
    }
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= expected) {
      errors.push("correctIndex must be an integer pointing to exactly one option");
    }
    if (type === "mcq" && Number.isInteger(q.correctIndex) && options[q.correctIndex]) {
      if (!sameText(answer, options[q.correctIndex].replace(/^[A-D]\)\s*/i, ""))) {
        errors.push("answer does not match the selected correct option");
      }
    }
    if (type === "true_false") {
      const allowed = new Set(["true", "false"]);
      if (!allowed.has(answer.toLowerCase())) errors.push('true_false answer must be "True" or "False"');
      if (options.join("|").toLowerCase() !== "true|false") errors.push('true_false options must be exactly ["True", "False"]');
      if (Number.isInteger(q.correctIndex) && answer.toLowerCase() !== options[q.correctIndex]?.toLowerCase()) {
        errors.push("true_false answer does not match correctIndex");
      }
    }
    if (type === "assertion") {
      if (!ASSERTION_OPTIONS.every((expected, i) => options[i] === expected)) {
        errors.push("assertion-reason options do not match the standard four-option format");
      }
      if (!/^Assertion\s*\(A\):[\s\S]+Reason\s*\(R\):/i.test(text)) {
        errors.push("assertion text must contain Assertion (A) and Reason (R)");
      }
    }
    if (type === "case" && !/read the passage:/i.test(text)) {
      errors.push('case question must begin with or contain "Read the passage:"');
    }
  } else if (options.length > 0) {
    errors.push(`type ${type} should not contain multiple-choice options`);
  }

  if (type === "fill_blank" && !/_{3,}/.test(text)) {
    errors.push("fill_blank text must contain a blank");
  }

  if (type === "very_short" && answer.split(/\s+/).filter(Boolean).length > 15) {
    errors.push("very_short answer exceeds 15 words");
  }


  const normalizedText = normalize(text);
  if (usedTexts?.has(normalizedText)) errors.push("duplicate question");

  return { valid: errors.length === 0, errors, normalizedText };
}

export function templateFor(type) {
  return TEMPLATES[type];
}
