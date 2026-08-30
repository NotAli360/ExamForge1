import User from "../models/User.js";

// ExamForge runs in guest mode: no login is required.
// A stable browser-generated guest ID is mapped to a lightweight User record
// so existing controllers can continue to scope exams, chat and analytics.
export async function requireAuth(req, res, next) {
  try {
    const guestId = String(req.headers["x-guest-id"] || "").trim();

    if (!guestId || !/^[a-zA-Z0-9_-]{16,100}$/.test(guestId)) {
      return res.status(400).json({ error: "Missing or invalid guest id" });
    }

    const email = `guest-${guestId}@guest.examforge.local`;
    const user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name: "Guest Student",
          email,
          passwordHash: "guest-mode-disabled",
          board: "CBSE",
          class: "9",
          roll: "",
          streakDays: 0,
          lastActiveDate: null,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
