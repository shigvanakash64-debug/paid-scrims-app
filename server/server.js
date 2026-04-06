import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import matchRoutes from "./routes/matchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initializeCronJobs, stopCronJobs } from "./utils/cronJobs.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // Alias for simpler deployed URL usage
app.use("/api/match", matchRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    
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
