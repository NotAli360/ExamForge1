import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  createExam,
  listExams,
  getExam,
  regenerateExamQuestion,
  submitExam,
} from "../controllers/exam.controller.js";

const router = Router();

// Full generation is the most expensive AI call in the app - cap it harder
// than a single-question regeneration.
const generateLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 10 });
const regenerateLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 30 });

router.use(requireAuth);
router.post("/", generateLimiter, createExam);
router.get("/", listExams);
router.get("/:id", getExam);
router.post("/:id/regenerate-question", regenerateLimiter, regenerateExamQuestion);
router.post("/:id/submit", submitExam);

export default router;
