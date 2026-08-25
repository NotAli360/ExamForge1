import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";
import { generateExam, regenerateQuestion } from "../services/examGenerator.service.js";

const MAX_QUESTION_COUNT = 60;
const MIN_QUESTION_COUNT = 1;
const MAX_TOPIC_LENGTH = 200;

export async function createExam(req, res, next) {
  try {
    const {
      class: klass,
      subject,
      chapter,
      topic,
      difficulty,
      bloomLevel,
      questionTypes,
      questionCount,
      includeAnswers,
    } = req.body;

    if (![klass, subject, chapter].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ error: "class, subject and chapter are required" });
    }
    if ([klass, subject, chapter].some((value) => value.length > 120)) {
      return res.status(400).json({ error: "class, subject and chapter must be under 120 characters" });
    }
    if (topic !== undefined && topic !== null && typeof topic !== "string") {
      return res.status(400).json({ error: "topic must be a string" });
    }
    if (typeof topic === "string" && topic.length > MAX_TOPIC_LENGTH) {
      return res.status(400).json({ error: `topic must be under ${MAX_TOPIC_LENGTH} characters` });
    }

    const parsedCount = Number(questionCount);
    if (questionCount !== undefined && (!Number.isFinite(parsedCount) || !Number.isInteger(parsedCount))) {
      return res.status(400).json({ error: "questionCount must be a whole number" });
    }
    const safeCount = Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, Number.isFinite(parsedCount) ? parsedCount : 20));

    if (questionTypes !== undefined && (typeof questionTypes !== "object" || Array.isArray(questionTypes))) {
      return res.status(400).json({ error: "questionTypes must be an object" });
    }

    const built = await generateExam({
      userId: req.user._id,
      class: klass,
      subject,
      chapter,
      topic,
      difficulty,
      bloomLevel,
      questionTypes,
      questionCount: safeCount,
    });

    const exam = await Exam.create({
      userId: req.user._id,
      title: `EXAM FORGE AI - CBSE CLASS ${klass} ${subject.toUpperCase()} PRACTICE TEST`,
      board: built.board,
      class: built.class,
      subject: built.subject,
      chapter: built.chapter,
      topic: built.topic,
      difficulty: built.difficulty,
      bloomLevel: built.bloomLevel,
      maxMarks: built.maxMarks,
      timeAllowed: built.timeAllowed,
      includeAnswers: includeAnswers !== false,
      instructions: built.instructions,
      sections: built.sections,
      generationStats: built.generationStats,
    });

    res.status(201).json({ exam, warnings: built.generationErrors });
  } catch (err) {
    next(err);
  }
}

export async function listExams(req, res, next) {
  try {
    const exams = await Exam.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("title subject chapter class difficulty maxMarks timeAllowed createdAt generationStats");
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

export async function getExam(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

export async function regenerateExamQuestion(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const localId = Number(req.body.localId);
    if (!localId) return res.status(400).json({ error: "localId is required" });

    const { source } = await regenerateQuestion({ exam, localId });
    await exam.save();
    res.json({ exam, source });
  } catch (err) {
    next(err);
  }
}

export async function submitExam(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const answers = req.body.answers || {}; // { localId: optionIndex }

    let total = 0;
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    let scoredMarks = 0;

    for (const sec of exam.sections) {
      for (const q of sec.questions) {
        total += 1;
        const given = answers[q.localId];
        if (given !== undefined && given !== null) {
          attempted += 1;
          if (q.correctIndex !== null && q.correctIndex !== undefined && Number(given) === q.correctIndex) {
            correct += 1;
            scoredMarks += q.marks || 1;
          } else {
            incorrect += 1;
          }
        }
      }
    }

    const unattempted = total - attempted;
    const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : "0.0";

    const attempt = await Attempt.create({
      examId: exam._id,
      userId: req.user._id,
      answers,
      total,
      attempted,
      unattempted,
      correct,
      incorrect,
      accuracy: `${accuracy}%`,
      score: `${scoredMarks}/${exam.maxMarks}`,
      subject: exam.subject,
      chapter: exam.chapter,
    });

    res.json({ attempt });
  } catch (err) {
    next(err);
  }
}
