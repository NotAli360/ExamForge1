import { Router } from "express";
import { signup, login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyFn: (req) => req.ip });

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);

export default router;
