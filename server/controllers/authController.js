import User from "../models/User.js";
import { createToken, generateSalt, hashPassword } from "../utils/authUtils.js";
import bcrypt from "bcrypt";

const sendError = (res, status, message, error) => {
  console.error(`[AUTH ERROR] ${message}:`, error);
  return res.status(status).json({
    error: message,
    details: error.message,
    stack: error.stack?.split('\n').slice(0, 5),
  });
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
    console.log("REGISTER BODY:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    console.log("CHECKING EXISTING USER:", username.trim().toLowerCase());
    const existing = await User.findOne({
      username: username.trim().toLowerCase(),
    });
    if (existing) {
      console.log("USER EXISTS:", existing.username);
      return res.status(409).json({ error: "Username already exists" });
    }

    console.log("GENERATING SALT AND HASH");
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    console.log("SALT:", salt, "HASH LENGTH:", passwordHash.length);

    console.log("CREATING USER");
    const user = await User.create({
      username: username.trim(),
      password: passwordHash,
      passwordSalt: salt,
    });
    console.log("USER CREATED:", user._id, user.username);

    console.log("CREATING TOKEN");
    const token = createToken({ userId: user._id.toString() });
    console.log("TOKEN CREATED, LENGTH:", token.length);

    console.log("SANITIZING USER");
    const sanitized = sanitizeUser(user);
    console.log("SANITIZED USER:", sanitized);

    return res.status(201).json({ user: sanitized, token });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.code === 11000) {
      return sendError(res, 409, 'Username already exists', error);
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

    const isValid = await bcrypt.compare(password + user.passwordSalt, user.password);
    if (!isValid) {
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

    const isValid = await bcrypt.compare(oldPassword + user.passwordSalt, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    const salt = generateSalt();
    user.passwordSalt = salt;
    user.password = await hashPassword(newPassword, salt);
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
