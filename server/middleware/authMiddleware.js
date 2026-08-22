import { verifyToken } from "../utils/authUtils.js";
import User from "../models/User.js";

/**
 * Auth middleware - Validates JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 * Sets req.userId and req.user from token payload
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = verifyToken(token);
      const userId = payload.userId || payload.sub || payload.id;

      if (!userId) {
        return res.status(401).json({ error: "Invalid token payload" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.userId = userId;
      req.user = user;
      req.isAdmin = user.role === 'admin';

      next();
    } catch (error) {
      return res.status(401).json({ error: error.message || "Invalid token" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Auth middleware error" });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const shouldRequirePhoneVerification = (user) => {
  if (!user) return false;

  const phone = typeof user.phone === 'string' ? user.phone.trim() : user.phone;
  if (!phone) {
    return false;
  }

  return !user.phoneVerified;
};

export const requireVerifiedPhone = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findById(req.userId).select('phoneVerified phone username');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (shouldRequirePhoneVerification(user)) {
      return res.status(403).json({
        success: false,
        code: 'PHONE_NOT_VERIFIED',
        message: 'Please verify your mobile number before continuing.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Could not verify mobile number status' });
  }
};
