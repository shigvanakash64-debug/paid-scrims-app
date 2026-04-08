import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import matchRoutes from "./routes/matchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initializeCronJobs, stopCronJobs } from "./utils/cronJobs.js";

dotenv.config();

console.log("Server starting with updated code - force redeploy");

const app = express();

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // Alias for simpler deployed URL usage
app.use("/api/match", matchRoutes);
app.use("/api/admin", adminRoutes);

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
