import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sendMessage, getHistory } from "../controllers/chat.controller.js";

const router = Router();
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

router.use(requireAuth);
router.post("/", chatLimiter, sendMessage);
router.get("/", getHistory);
export default router;
