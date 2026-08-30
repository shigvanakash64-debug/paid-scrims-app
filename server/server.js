import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import matchRoutes from "./routes/matchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import wallpaperRoutes from "./routes/wallpaperRoutes.js";
import brRoutes from "./routes/brRoutes.js";
import User from "./models/User.js";
import { initializeCronJobs, stopCronJobs } from "./utils/cronJobs.js";

console.log("Server starting with updated code - force redeploy");

const app = express();
app.disable("x-powered-by");
app.set('trust proxy', 1);

// Security headers and protections
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please slow down.' }
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests, please try again later.' }
});

const matchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many match actions, please slow down.' }
});

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // More lenient for notifications
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many notification requests, please try again later.' }
});

const allowedOrigins = [
  "https://www.clutchzone.in",
  "https://clutchzone.in",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(globalLimiter);

// Capture raw body as well for webhook signature validation.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString('utf-8'); } }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get(["/health", "/api/health"], async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: dbStatus,
      mongoUri: process.env.MONGO_URI ? 'set' : 'not set'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 🐛 DEBUG: Notification System Status
app.get("/api/debug/notifications", async (req, res) => {
  try {
    const User = (await import("./models/User.js")).default;
    
    const hasAppId = !!process.env.ONESIGNAL_APP_ID;
    const hasRestKey = !!process.env.ONESIGNAL_REST_API_KEY;
    
    // Count users with player IDs
    const usersWithPlayerId = await User.countDocuments({
      onesignalPlayerId: { $exists: true, $ne: null }
    });
    
    const totalUsers = await User.countDocuments({});
    
    // Get sample users with and without IDs
    const withIds = await User.find({ onesignalPlayerId: { $exists: true, $ne: null } })
      .select('username onesignalPlayerId notificationPreferences')
      .limit(5);
    
    const withoutIds = await User.find({ $or: [
      { onesignalPlayerId: null },
      { onesignalPlayerId: { $exists: false } }
    ]})
      .select('username onesignalPlayerId')
      .limit(5);

    res.json({
      status: 'debug',
      oneSignal: {
        appIdSet: hasAppId,
        restApiKeySet: hasRestKey,
        configComplete: hasAppId && hasRestKey,
        appIdPreview: hasAppId ? process.env.ONESIGNAL_APP_ID.substring(0, 8) + '...' : 'NOT SET'
      },
      users: {
        total: totalUsers,
        withPlayerId: usersWithPlayerId,
        withoutPlayerId: totalUsers - usersWithPlayerId,
        percentageRegistered: ((usersWithPlayerId / totalUsers) * 100).toFixed(2) + '%'
      },
      samples: {
        usersWithIds: withIds.map(u => ({
          username: u.username,
          playerId: u.onesignalPlayerId?.substring(0, 10) + '...',
          matchNotifications: u.notificationPreferences?.matchNotifications,
          walletNotifications: u.notificationPreferences?.walletNotifications,
          systemNotifications: u.notificationPreferences?.systemNotifications
        })),
        usersWithoutIds: withoutIds.map(u => ({
          username: u.username,
          playerId: u.onesignalPlayerId || 'NULL'
        }))
      },
      solutions: !hasAppId || !hasRestKey ? [
        `❌ Missing OneSignal credentials in .env file`,
        `✅ Visit: https://dashboard.onesignal.com`,
        `✅ Create app and copy App ID and REST API Key`,
        `✅ Add to .env: ONESIGNAL_APP_ID=xxx`,
        `✅ Add to .env: ONESIGNAL_REST_API_KEY=xxx`,
        `✅ Restart server`
      ] : usersWithPlayerId === 0 ? [
        `⚠️  No users have registered OneSignal player IDs`,
        `✅ User must call: POST /auth/notifications/register-push with onesignalPlayerId`,
        `✅ Ensure OneSignal SDK is loaded on client`,
        `✅ Call OneSignal.getPlayerId() on client after login`
      ] : []
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug check failed',
      message: error.message 
    });
  }
});

// 🧪 TEST: Send Test Notification (Admin only)
app.post("/api/debug/test-notification", async (req, res) => {
  try {
    const { sendNotification } = await import("./services/notificationService.js");
    const User = (await import("./models/User.js")).default;

    // Get first user with registered player ID
    const user = await User.findOne({ 
      onesignalPlayerId: { $exists: true, $ne: null } 
    }).select('username onesignalPlayerId');

    if (!user) {
      return res.json({
        success: false,
        error: 'No users with registered OneSignal player IDs found',
        solution: 'Please register a player ID first via POST /auth/notifications/register-push'
      });
    }

    // Send test notification
    const result = await sendNotification(
      [user.onesignalPlayerId],
      '🧪 Test Notification',
      'This is a test notification from Clutch Zone backend',
      { type: 'info', priority: 10 }
    );

    res.json({
      success: true,
      result,
      testUser: {
        username: user.username,
        playerId: user.onesignalPlayerId.substring(0, 15) + '...'
      },
      message: 'Check your device for notification in a few seconds'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message 
    });
  }
});

// Routes
// Apply stricter limiter only to login/register endpoints
app.post("/api/auth/login", authLimiter, (req, res, next) => next());
app.post("/auth/login", authLimiter, (req, res, next) => next());
app.post("/api/auth/register", authLimiter, (req, res, next) => next());
app.post("/auth/register", authLimiter, (req, res, next) => next());

// Use more lenient notification limiter for notifications
app.use("/api/auth/notifications", notificationLimiter);
app.use("/auth/notifications", notificationLimiter);

// Use standard auth limiter for other auth routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/auth", authLimiter, authRoutes); // Alias for simpler deployed URL usage
app.use("/api/match", matchLimiter, matchRoutes);
app.use("/api/wallet", matchLimiter, walletRoutes);
app.use("/api/cashfree", matchLimiter, (await import("./routes/cashfreeRoutes.js")).default);
app.use("/api/rewards", matchLimiter, rewardRoutes);
app.use("/api/wallpapers", wallpaperRoutes);
app.use("/api/wallpaper", wallpaperRoutes);
app.use("/api/br-match", matchLimiter, brRoutes);
app.use("/api/br-participant", matchLimiter, brRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    await cleanupLegacyIndexes();
    
    // Import User model for cron jobs (adjust path if needed)
    // For now, we'll defer User model import until cron initialization
    const server = app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
      
      // Initialize cron jobs after server starts
      // Pass User model here when available
      initializeCronJobsWithUserModel(app);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received - shutting down gracefully");
      stopCronJobs();
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  })
  .catch(err => console.log(err));

/**
 * Initialize cron jobs with User model
 * User model should be imported after database connection
 */
async function initializeCronJobsWithUserModel(app) {
  try {
    initializeCronJobs(User);
    console.log("[INIT] Match timeout and auto-resolution cron jobs started");
  } catch (error) {
    console.error("Error initializing cron jobs:", error);
  }
}

async function cleanupLegacyIndexes() {
  try {
    const { default: User } = await import("./models/User.js");
    const hasEmailIndex = await User.collection.indexExists("email_1");
    if (hasEmailIndex) {
      await User.collection.dropIndex("email_1");
      console.log("Dropped legacy email_1 index from users collection");
    } else {
      console.log("No legacy email_1 index found");
    }
  } catch (error) {
    if (error.message.includes("index not found")) {
      console.log("Legacy email index not found, no cleanup needed.");
      return;
    }
    console.error("Error cleaning up legacy indexes:", error);
  }
}
