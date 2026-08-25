import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export async function signup(req, res, next) {
  try {
    const { name, email, password, board, class: klass, roll } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (typeof name !== "string" || name.trim().length > 100) {
      return res.status(400).json({ error: "name is invalid" });
    }
    if (typeof email !== "string" || email.length > 254) {
      return res.status(400).json({ error: "email is invalid" });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "password must be 8-128 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      board: board || "CBSE",
      class: klass || "9",
      roll: roll || "",
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    // streak bookkeeping
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      user.streakDays = user.lastActiveDate === yesterday ? user.streakDays + 1 : 1;
      user.lastActiveDate = today;
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    board: user.board,
    class: user.class,
    roll: user.roll,
    streakDays: user.streakDays,
  };
}
