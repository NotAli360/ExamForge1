import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { history, summary } from "../controllers/analytics.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/history", history);
router.get("/summary", summary);
export default router;
