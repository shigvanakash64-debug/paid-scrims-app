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
  role: user.role || 'user',
  isAdmin: user.role === 'admin',
  ffUid: user.ffUid || "",
  wallet: {
    balance: user.wallet?.balance || 0,
    transactions: user.wallet?.transactions || [],
    pendingWithdrawals: user.wallet?.pendingWithdrawals || [],
  },
  trustScore: user.trustScore,
  matchesPlayed: user.matchesPlayed,
  matchesWon: user.matchesWon,
  matchesLost: user.matchesLost,
  disputesRaised: user.disputesRaised,
  disputesLost: user.disputesLost,
  notifications: (user.notifications || []).map((notification) => ({
    id: notification._id?.toString ? notification._id.toString() : undefined,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    relatedMatch: notification.relatedMatch,
    read: notification.read,
    createdAt: notification.createdAt,
  })),
  unreadNotifications: (user.notifications || []).filter((notification) => !notification.read).length,
});

export const register = async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    let { username, password } = req.body;
    username = username || req.body.name || req.body.userName || req.body.user;

    if (!username || !password) {
      console.log("REGISTER MISSING FIELD:", { username, password });
      return res.status(400).json({ error: "Username and password are required" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    console.log("CHECKING EXISTING USER:", normalizedUsername);
    const existing = await User.findOne({ username: normalizedUsername });
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
      username: normalizedUsername,
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
      const conflictField = error.keyPattern?.username
        ? 'Username'
        : error.keyPattern?.email
        ? 'Email'
        : 'User';
      return sendError(res, 409, `${conflictField} already exists`, error);
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

export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const notification = user.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    notification.read = true;
    await user.save();
    return res.json({ success: true, notifications: sanitizeUser(user).notifications, unreadNotifications: sanitizeUser(user).unreadNotifications });
  } catch (error) {
    return sendError(res, 500, 'Could not mark notification read', error);
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.notifications = (user.notifications || []).map((notification) => ({
      ...notification.toObject(),
      read: true,
    }));
    await user.save();
    return res.json({ success: true, notifications: sanitizeUser(user).notifications, unreadNotifications: 0 });
  } catch (error) {
    return sendError(res, 500, 'Could not mark notifications read', error);
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

/**
 * Register or update OneSignal player ID for push notifications
 * POST /auth/notifications/register-push
 */
export const registerPushNotificationId = async (req, res) => {
  try {
    const { onesignalPlayerId } = req.body;
    const userId = req.userId;

    if (!onesignalPlayerId || !onesignalPlayerId.trim()) {
      return res.status(400).json({ error: 'OneSignal Player ID is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { onesignalPlayerId: onesignalPlayerId.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Push notification ID registered successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to register push notification ID', error);
  }
};

/**
 * Update notification preferences
 * PUT /auth/notifications/preferences
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { matchNotifications, walletNotifications, systemNotifications } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update only provided preferences
    if (matchNotifications !== undefined) {
      user.notificationPreferences.matchNotifications = matchNotifications;
    }
    if (walletNotifications !== undefined) {
      user.notificationPreferences.walletNotifications = walletNotifications;
    }
    if (systemNotifications !== undefined) {
      user.notificationPreferences.systemNotifications = systemNotifications;
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update notification preferences', error);
  }
};
