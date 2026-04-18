import express from "express";
import {
  register,
  login,
  getMe,
  changePassword,
  updateProfile,
  markNotificationRead,
  markAllNotificationsRead,
  registerPushNotificationId,
  updateNotificationPreferences,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/change-password", authMiddleware, changePassword);
router.put("/profile", authMiddleware, updateProfile);
router.post("/notifications/mark-read", authMiddleware, markNotificationRead);
router.post("/notifications/read-all", authMiddleware, markAllNotificationsRead);
router.post("/notifications/register-push", authMiddleware, registerPushNotificationId);
router.put("/notifications/preferences", authMiddleware, updateNotificationPreferences);

export default router;
