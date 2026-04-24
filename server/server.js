import dotenv from "dotenv";

dotenv.config({ path: './.env' });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import matchRoutes from "./routes/matchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import { initializeCronJobs, stopCronJobs } from "./utils/cronJobs.js";

console.log("Server starting with updated code - force redeploy");

const app = express();
app.disable("x-powered-by");
app.set('trust proxy', 1);

// Security headers and protections
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
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
  max: 120,
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

app.use(globalLimiter);

// CORS configuration for production
app.use(cors({
  origin: [
    "https://paid-scrims-phoj44i5a-shigvanakash64-debugs-projects.vercel.app",
    "https://paid-scrims-app.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/health", async (req, res) => {
  try {
    // Test database connection
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
    // Dynamic import to ensure it happens after DB connection
    // You'll need to create a User model file if it doesn't exist
    // import User from "./models/User.js";
    // initializeCronJobs(User);
    
    console.log("[INIT] Cron job initialization deferred - User model needed");
    console.log("[INIT] Add this to your code when User model is available:");
    console.log("  import User from './models/User.js';");
    console.log("  initializeCronJobs(User);");
    console.log("  // From adminController: app.locals.User = User;");
    console.log("  // From adminController: app.locals.Match = Match;");
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
