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

    // Decode JWT manually (basic decode without verification)
    // In production, use jwt.verify() with secret key
    try {
      const base64Payload = token.split(".")[1];
      const payload = JSON.parse(Buffer.from(base64Payload, "base64"));
      
      req.userId = payload.userId || payload.sub || payload.id;
      
      if (!req.userId) {
        return res.status(401).json({ error: "Invalid token payload" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token format" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Auth middleware error" });
  }
};
