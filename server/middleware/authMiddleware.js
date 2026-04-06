import { verifyToken } from "../utils/authUtils.js";

/**
 * Auth middleware - Validates JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 * Sets req.userId from token payload
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = verifyToken(token);
      req.userId = payload.userId || payload.sub || payload.id;

      if (!req.userId) {
        return res.status(401).json({ error: "Invalid token payload" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: error.message || "Invalid token" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Auth middleware error" });
  }
};
