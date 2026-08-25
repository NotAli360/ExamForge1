import Question from "../models/Question.js";
import { cosineSimilarity, generateEmbeddings, isLLMConfigured } from "./llm.service.js";

const SEMANTIC_ENABLED = () => process.env.ENABLE_SEMANTIC_RETRIEVAL !== "false";
const SEMANTIC_POOL_MULTIPLIER = 5;
const MAX_EMBEDDING_BATCH = 40;

/**
 * Finds verified bank questions. When a topic is supplied, a bounded lexical
 * candidate pool is optionally re-ranked with embeddings. If embeddings are
 * unavailable, the normal MongoDB retrieval path remains fully functional.
 */
export async function findBankQuestions({
  board,
  class: klass,
  subject,
  chapter,
  topic,
  type,
  difficulty,
  limit,
  excludeIds = [],
}) {
  const query = {
    board,
    class: klass,
    subject,
    chapter,
    type,
    source: "bank",
    verified: true,
    _id: { $nin: excludeIds },
  };
  if (difficulty) query.difficulty = difficulty;
  if (topic) query.topic = { $regex: escapeRegex(topic), $options: "i" };

  // Prefer exact topic matches first. The larger candidate pool gives the
  // semantic reranker enough material to improve relevance without scanning
  // the entire collection.
  let results = await Question.find(query).select("+embedding").limit(Math.min(100, Math.max(limit, limit * SEMANTIC_POOL_MULTIPLIER))).lean();

  // Fall back to same chapter when exact topic matching is sparse.
  if (results.length < limit) {
    const more = await Question.find({
      board,
      class: klass,
      subject,
      chapter,
      type,
      source: "bank",
      verified: true,
      _id: { $nin: [...excludeIds, ...results.map((r) => r._id)] },
    })
      .select("+embedding")
      .limit(Math.min(100, Math.max(limit - results.length, limit * 2)))
      .lean();
    results = [...results, ...more];
  }

  if (results.length <= limit || !topic || !SEMANTIC_ENABLED() || !isLLMConfigured()) {
    return results.slice(0, limit);
  }

  try {
    const semanticQuery = `${board} Class ${klass} ${subject} ${chapter} ${topic} ${type} ${difficulty || ""}`;
    const [queryEmbedding] = await generateEmbeddings([semanticQuery]);
    if (!queryEmbedding) return results.slice(0, limit);

    const missing = results.filter((q) => !Array.isArray(q.embedding) || q.embedding.length === 0);
    if (missing.length) {
      // Never send an unbounded batch to the embedding endpoint.
      const batch = missing.slice(0, MAX_EMBEDDING_BATCH);
      const embeddings = await generateEmbeddings(batch.map(toEmbeddingText));

      await Promise.all(
        batch.map(async (q, i) => {
          const embedding = embeddings[i];
          if (!embedding) return;
          q.embedding = embedding;
          try {
            await Question.updateOne({ _id: q._id }, { $set: { embedding } });
          } catch {
            // Cache failure is non-fatal; the question can still be returned.
          }
        })
      );
    }

    return results
      .map((q) => ({
        q,
        score: Array.isArray(q.embedding) ? cosineSimilarity(queryEmbedding, q.embedding) : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ q }) => q);
  } catch (err) {
    // Semantic retrieval is an enhancement, never a single point of failure.
    console.warn("[question-bank] semantic rerank unavailable; using lexical retrieval", err.message);
    return results.slice(0, limit);
  }
}

function toEmbeddingText(q) {
  return [q.board, `Class ${q.class}`, q.subject, q.chapter, q.topic, q.type, q.difficulty, q.text]
    .filter(Boolean)
    .join(" | ");
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchBank({ board, class: klass, subject, chapter, type, difficulty, q, page = 1, pageSize = 20 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const query = {};
  if (board) query.board = board;
  if (klass) query.class = klass;
  if (subject) query.subject = subject;
  if (chapter) query.chapter = chapter;
  if (type) query.type = type;
  if (difficulty) query.difficulty = difficulty;
  if (q) query.text = { $regex: escapeRegex(q), $options: "i" };

  const skip = (safePage - 1) * safePageSize;
  const [items, total] = await Promise.all([
    Question.find(query).sort({ createdAt: -1 }).skip(skip).limit(safePageSize).lean(),
    Question.countDocuments(query),
  ]);
  return { items, total, page: safePage, pageSize: safePageSize };
}
