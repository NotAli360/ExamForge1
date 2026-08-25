import Question, { normalize } from "../models/Question.js";
import { findBankQuestions } from "./questionBank.service.js";
import { callLLM, extractQuestionsArray, isLLMConfigured } from "./llm.service.js";
import { validateQuestion, templateFor } from "./validator.service.js";
import { marksForType, sectionNameForType } from "./templates.js";

const DEFAULT_TYPE_WEIGHTS = {
  mcq: 0.35,
  assertion: 0.1,
  short: 0.2,
  long: 0.1,
  case: 0.1,
  very_short: 0.1,
  fill_blank: 0.03,
  true_false: 0.02,
};

/**
 * Splits `count` questions across the enabled types proportionally to
 * DEFAULT_TYPE_WEIGHTS, guaranteeing at least 1 of each enabled type
 * when count allows it.
 */
function planDistribution(enabledTypes, count) {
  if (!enabledTypes.length || count <= 0) return [];

  // When the requested paper is smaller than the number of enabled types,
  // never generate more questions than requested. Allocate one question to
  // the highest-weight types first, then distribute the remainder by weight.
  const ordered = [...enabledTypes].sort(
    (a, b) => (DEFAULT_TYPE_WEIGHTS[b] ?? 0.1) - (DEFAULT_TYPE_WEIGHTS[a] ?? 0.1)
  );
  const active = ordered.slice(0, Math.min(count, ordered.length));
  const plan = active.map((type) => ({ type, n: 1 }));
  let remaining = count - plan.length;

  while (remaining > 0) {
    let best = plan[0];
    for (const item of plan) {
      const currentWeight = DEFAULT_TYPE_WEIGHTS[item.type] ?? 0.1;
      const score = currentWeight / item.n;
      const bestScore = (DEFAULT_TYPE_WEIGHTS[best.type] ?? 0.1) / best.n;
      if (score > bestScore) best = item;
    }
    best.n += 1;
    remaining -= 1;
  }

  return plan;
}

function buildLLMPrompt({ board, class: klass, subject, chapter, topic, difficulty, bloomLevel, type, n, avoidTexts, referenceQuestions }) {
  const tpl = templateFor(type);
  const system = `You are an expert ${board} exam-paper setter for Class ${klass} ${subject}, strictly following the current ${board} syllabus. You write syllabus-accurate, unambiguous, non-repetitive exam questions. You ALWAYS respond with a single JSON object and nothing else - no markdown fences, no commentary.`;

  const avoidBlock =
    avoidTexts && avoidTexts.length
      ? `\nDo NOT repeat or closely paraphrase any of these existing questions:\n- ${avoidTexts.slice(0, 25).join("\n- ")}`
      : "";

  const referenceBlock =
    referenceQuestions && referenceQuestions.length
      ? `\nReference material from the verified Exam Forge question bank. Use it to ground facts and terminology, but write ORIGINAL questions and do not copy the wording or answer verbatim:\n${referenceQuestions
          .slice(0, 8)
          .map((q, i) => `${i + 1}. Q: ${q.text}\n   A: ${q.answer || ""}`)
          .join("\n")}`
      : "";

  const user = `Generate exactly ${n} "${tpl.label}" question(s) for:
Board: ${board}
Class: ${klass}
Subject: ${subject}
Chapter: ${chapter}${topic ? `\nTopic focus: ${topic}` : ""}
Difficulty: ${difficulty}
Bloom's level: ${bloomLevel}

Format rules for this question type: ${tpl.rules}
Each item in the "questions" array MUST match this shape exactly:
${tpl.schemaHint}
${referenceBlock}
${avoidBlock}

Respond with ONLY this JSON object shape: { "questions": [ ${n} object(s) matching the schema above ] }. No prose, no markdown fences, no keys other than "questions".`;

  return { system, user };
}

/**
 * Generates only the questions needed to cover `n`, retrying a bounded
 * number of times against the validator, and only calling the LLM for the
 * deficit that the bank couldn't cover.
 */
async function generateAIQuestions({ criteria, type, n, usedTexts, referenceQuestions = [] }) {
  if (n <= 0) return { questions: [], errors: [] };
  if (!isLLMConfigured()) {
    return { questions: [], errors: [`LLM not configured - skipped ${n} AI question(s) of type ${type}`] };
  }

  const collected = [];
  const errors = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (collected.length < n && attempts < maxAttempts) {
    attempts += 1;
    const need = n - collected.length;
    const avoidTexts = [...usedTexts, ...collected.map((c) => c.text)];
    const { system, user } = buildLLMPrompt({ ...criteria, type, n: need, avoidTexts, referenceQuestions });

    let raw;
    try {
      raw = await callLLM(system, user, { jsonMode: true });
    } catch (err) {
      // err.message here is always our own safe wording (see llm.service.js) -
      // never raw provider text, never anything containing the API key.
      errors.push(err.message);
      break;
    }

    const arr = extractQuestionsArray(raw);
    for (const candidate of arr) {
      if (collected.length >= n) break;
      const { valid, errors: qErrors, normalizedText } = validateQuestion(candidate, {
        type,
        difficulty: criteria.difficulty,
        usedTexts: new Set([...usedTexts, ...collected.map((c) => normalize(c.text))]),
      });
      if (!valid) {
        errors.push(`rejected AI question: ${qErrors.join("; ")}`);
        continue;
      }
      collected.push({
        type,
        text: candidate.text.trim(),
        options: candidate.options || [],
        correctIndex: typeof candidate.correctIndex === "number" ? candidate.correctIndex : null,
        answer: candidate.answer.trim(),
        explanation: (candidate.explanation || "").trim(),
        marks: marksForType(type),
        difficulty: criteria.difficulty,
        source: "ai",
        _normalizedText: normalizedText,
      });
    }
  }

  return { questions: collected, errors };
}

/**
 * Main entry point: builds a full exam by first pulling verified bank
 * questions, then filling any deficit with validated AI-generated ones.
 */
export async function generateExam({
  userId,
  board = "CBSE",
  class: klass,
  subject,
  chapter,
  topic = "",
  difficulty = "Medium",
  bloomLevel = "Understanding (Level 2)",
  questionTypes = {},
  questionCount = 20,
}) {
  const enabledTypes = Object.entries(questionTypes)
    .filter(([, on]) => on)
    .map(([t]) => t)
    .filter((t) => DEFAULT_TYPE_WEIGHTS[t] !== undefined);

  if (enabledTypes.length === 0) enabledTypes.push("mcq", "short", "long");

  const plan = planDistribution(enabledTypes, questionCount);

  const usedTexts = new Set();
  const usedBankIds = [];
  const allQuestions = [];
  const generationErrors = [];
  let fromBank = 0;
  let fromAI = 0;

  for (const { type, n } of plan) {
    const bankMatches = await findBankQuestions({
      board,
      class: klass,
      subject,
      chapter,
      topic,
      type,
      difficulty,
      limit: n,
      excludeIds: usedBankIds,
    });

    let acceptedBankCount = 0;
    const acceptedBankQuestions = [];
    for (const bq of bankMatches) {
      const norm = normalize(bq.text);
      if (usedTexts.has(norm)) continue;
      usedTexts.add(norm);
      acceptedBankCount += 1;
      acceptedBankQuestions.push(bq);
      usedBankIds.push(bq._id);
      allQuestions.push({
        questionId: bq._id,
        type: bq.type,
        text: bq.text,
        options: bq.options,
        correctIndex: bq.correctIndex,
        answer: bq.answer,
        explanation: bq.explanation,
        marks: bq.marks || marksForType(type),
        difficulty: bq.difficulty,
        source: "bank",
      });
      fromBank += 1;
    }

    const deficit = n - acceptedBankCount;
    if (deficit > 0) {
      const { questions: aiQuestions, errors } = await generateAIQuestions({
        criteria: { board, class: klass, subject, chapter, topic, difficulty, bloomLevel },
        type,
        n: deficit,
        usedTexts,
        referenceQuestions: acceptedBankQuestions,
      });
      generationErrors.push(...errors);
      for (const aq of aiQuestions) {
        usedTexts.add(aq._normalizedText);
        allQuestions.push({ ...aq, questionId: null });
        fromAI += 1;
      }
    }
  }

  // Persist newly-generated AI questions back into the bank (unverified) so
  // future exams can reuse them without another LLM call.
  const aiToPersist = allQuestions.filter((q) => q.source === "ai");
  if (aiToPersist.length) {
    try {
      const docs = await Question.insertMany(
        aiToPersist.map((q) => ({
          board,
          class: klass,
          subject,
          chapter,
          topic,
          type: q.type,
          difficulty: q.difficulty,
          bloomLevel,
          marks: q.marks,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          answer: q.answer,
          explanation: q.explanation,
          source: "ai",
          verified: false,
        })),
        { ordered: false }
      );
      docs.forEach((doc, i) => {
        // best-effort link back; order matches insertMany input order
        const target = aiToPersist[i];
        if (target) target.questionId = doc._id;
      });
    } catch (err) {
      generationErrors.push(`could not persist AI questions to bank: ${err.message}`);
    }
  }

  // Assign stable localIds and group into sections in a fixed display order
  let localId = 1;
  for (const q of allQuestions) q.localId = localId++;

  const sectionOrder = [
    "SECTION A - Objective & Assertion-Reason (1 Mark Each)",
    "SECTION B - Short Answer Questions (2-3 Marks Each)",
    "SECTION C - Long Answer & HOTS (5 Marks Each)",
    "SECTION D - Case-Based Competency Question (4 Marks)",
  ];
  const bySection = new Map(sectionOrder.map((n) => [n, []]));
  for (const q of allQuestions) {
    const name = sectionNameForType(q.type);
    if (!bySection.has(name)) bySection.set(name, []);
    bySection.get(name).push(q);
  }
  const sections = [...bySection.entries()]
    .filter(([, qs]) => qs.length > 0)
    .map(([name, questions]) => ({ name, questions }));

  const maxMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

  return {
    board,
    class: klass,
    subject,
    chapter,
    topic,
    difficulty,
    bloomLevel,
    maxMarks,
    timeAllowed: `${Math.max(30, Math.round(questionCount * 2.5))} Minutes`,
    instructions: [
      "All questions are compulsory.",
      "The question paper consists of sections grouped by question type and marks.",
      "Internal choices are given in some questions.",
    ],
    sections,
    generationStats: { requested: questionCount, fromBank, fromAI },
    generationErrors,
  };
}

/** Regenerates a single question in-place, preferring the bank, else the LLM. */
export async function regenerateQuestion({ exam, localId }) {
  let target = null;
  for (const sec of exam.sections) {
    const found = sec.questions.find((q) => q.localId === localId);
    if (found) {
      target = found;
      break;
    }
  }
  if (!target) {
    const err = new Error("Question not found in this exam");
    err.status = 404;
    throw err;
  }

  const usedTexts = new Set();
  const usedIds = [];
  for (const sec of exam.sections) {
    for (const q of sec.questions) {
      usedTexts.add(normalize(q.text));
      if (q.questionId) usedIds.push(q.questionId);
    }
  }

  const bankMatches = await findBankQuestions({
    board: exam.board,
    class: exam.class,
    subject: exam.subject,
    chapter: exam.chapter,
    topic: exam.topic,
    type: target.type,
    difficulty: exam.difficulty,
    limit: 1,
    excludeIds: usedIds,
  });

  if (bankMatches.length && !usedTexts.has(normalize(bankMatches[0].text))) {
    const bq = bankMatches[0];
    Object.assign(target, {
      questionId: bq._id,
      text: bq.text,
      options: bq.options,
      correctIndex: bq.correctIndex,
      answer: bq.answer,
      explanation: bq.explanation,
      marks: bq.marks || target.marks,
      difficulty: bq.difficulty,
      source: "bank",
    });
    return { exam, source: "bank" };
  }

  const { questions: aiQuestions, errors } = await generateAIQuestions({
    criteria: {
      board: exam.board,
      class: exam.class,
      subject: exam.subject,
      chapter: exam.chapter,
      topic: exam.topic,
      difficulty: exam.difficulty,
      bloomLevel: exam.bloomLevel,
    },
    type: target.type,
    n: 1,
    usedTexts,
  });

  if (!aiQuestions.length) {
    const err = new Error(`Could not regenerate question: ${errors.join("; ") || "no bank or AI result available"}`);
    err.status = 502;
    throw err;
  }

  const aq = aiQuestions[0];
  let questionId = null;
  try {
    const doc = await Question.create({
      board: exam.board,
      class: exam.class,
      subject: exam.subject,
      chapter: exam.chapter,
      topic: exam.topic,
      type: aq.type,
      difficulty: aq.difficulty,
      bloomLevel: exam.bloomLevel,
      marks: aq.marks,
      text: aq.text,
      options: aq.options,
      correctIndex: aq.correctIndex,
      answer: aq.answer,
      explanation: aq.explanation,
      source: "ai",
      verified: false,
    });
    questionId = doc._id;
  } catch {
    /* non-fatal: still return the question even if persistence failed */
  }

  Object.assign(target, {
    questionId,
    text: aq.text,
    options: aq.options,
    correctIndex: aq.correctIndex,
    answer: aq.answer,
    explanation: aq.explanation,
    marks: aq.marks,
    difficulty: aq.difficulty,
    source: "ai",
  });

  return { exam, source: "ai" };
}
