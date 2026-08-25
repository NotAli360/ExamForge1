import ChatMessage from "../models/ChatMessage.js";
import { callLLM, isLLMConfigured } from "../services/llm.service.js";

const MAX_MESSAGE_LENGTH = 2000;

export async function sendMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });
    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters` });
    }

    await ChatMessage.create({ userId: req.user._id, role: "user", text });

    let reply;
    if (isLLMConfigured()) {
      try {
        reply = await callLLM(
          `You are the Exam Forge AI Study Assistant, helping a CBSE Class ${req.user.class} student. ` +
            `Answer clearly and concisely (2-5 sentences), CBSE-syllabus-accurate, and offer to generate a practice question when relevant.`,
          text
        );
      } catch (err) {
        reply = fallbackReply(text);
      }
    } else {
      reply = fallbackReply(text);
    }

    await ChatMessage.create({ userId: req.user._id, role: "assistant", text: reply });
    res.json({ reply });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id }).sort({ createdAt: 1 }).limit(100);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

function fallbackReply(userMsg) {
  const lower = userMsg.toLowerCase();
  if (lower.includes("tissue")) {
    return "Tissues are groups of cells with similar origin, structure and function. In plants they're divided into meristematic (dividing) and permanent (non-dividing) tissues.";
  }
  if (lower.includes("polynomial") || lower.includes("math")) {
    return "A polynomial is an algebraic expression made of variables and coefficients, using only addition, subtraction, multiplication and non-negative integer exponents.";
  }
  return `Here's a quick pointer on "${userMsg}": focus on conceptual clarity and diagram labelling per the latest CBSE guidelines. Want me to generate a practice question on this? (Note: connect an LLM API key on the backend for fuller answers.)`;
}
