import User from "../models/User.js";
import { createToken, generateSalt, hashPassword } from "../utils/authUtils.js";

const sendError = (res, status, message, error) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[AUTH ERROR] ${message}:`, error);
    return res.status(status).json({ error: message, details: error.message });
  }
  return res.status(status).json({ error: message });
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  ffUid: user.ffUid || "",
  balance: user.wallet?.balance || 0,
  trustScore: user.trustScore,
  matchesPlayed: user.matchesPlayed,
  matchesWon: user.matchesWon,
  disputesRaised: user.disputesRaised,
});

export const register = async (req, res) => {
  try {
    const { username, password, ffUid } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existing = await User.findOne({
      username: username.trim().toLowerCase(),
    });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const user = await User.create({
      username: username.trim(),
      password: passwordHash,
      passwordSalt: salt,
      ffUid: ffUid?.trim() || "",
      wallet: { balance: 0 },
      trustScore: 100,
    });

    const token = createToken({ userId: user._id.toString() });
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'Username or email already exists', error);
    }
    return sendError(res, 500, 'Registration failed', error);
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordHash = hashPassword(password, user.passwordSalt || "");
    if (passwordHash !== user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken({ userId: user._id.toString() });
    return res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    return sendError(res, 500, 'Login failed', error);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return sendError(res, 500, 'Could not load user', error);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new passwords are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentHash = hashPassword(oldPassword, user.passwordSalt || "");
    if (currentHash !== user.password) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    const salt = generateSalt();
    user.passwordSalt = salt;
    user.password = hashPassword(newPassword, salt);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return sendError(res, 500, 'Failed to change password', error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { ffUid } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.ffUid = ffUid?.trim() || "";
    await user.save();

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return sendError(res, 500, 'Failed to update profile', error);
  }
};
