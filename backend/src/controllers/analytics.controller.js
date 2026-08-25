import Attempt from "../models/Attempt.js";

export async function history(req, res, next) {
  try {
    const attempts = await Attempt.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ history: attempts });
  } catch (err) {
    next(err);
  }
}

export async function summary(req, res, next) {
  try {
    const attempts = await Attempt.find({ userId: req.user._id });
    const totalAttempts = attempts.length;
    const totalCorrect = attempts.reduce((s, a) => s + a.correct, 0);
    const totalAttempted = attempts.reduce((s, a) => s + a.attempted, 0);
    const avgAccuracy = totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) : "0.0";

    const bySubject = {};
    for (const a of attempts) {
      bySubject[a.subject] = bySubject[a.subject] || { attempts: 0, correct: 0, attempted: 0 };
      bySubject[a.subject].attempts += 1;
      bySubject[a.subject].correct += a.correct;
      bySubject[a.subject].attempted += a.attempted;
    }

    res.json({
      totalAttempts,
      avgAccuracy: `${avgAccuracy}%`,
      streakDays: req.user.streakDays,
      bySubject,
    });
  } catch (err) {
    next(err);
  }
}
