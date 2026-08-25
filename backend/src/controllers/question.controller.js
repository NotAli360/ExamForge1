import { searchBank } from "../services/questionBank.service.js";

export async function search(req, res, next) {
  try {
    const { board, class: klass, subject, chapter, type, difficulty, q, page, pageSize } = req.query;
    const result = await searchBank({
      board,
      class: klass,
      subject,
      chapter,
      type,
      difficulty,
      q,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
