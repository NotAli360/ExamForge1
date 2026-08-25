import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { search } from "../controllers/question.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/bank", search);
export default router;
