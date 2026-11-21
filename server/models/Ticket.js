import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `CZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    },
    subject: {
      type: String,
      trim: true,
      default: "General Issue",
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "open", "resolved", "closed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["payment_deposit", "wallet_balance", "withdrawal", "tournament", "direct_match", "result_dispute", "account_restriction", "privacy", "host_complaint", "other"],
      default: "other",
    },
    referenceId: {
      type: String,
      trim: true,
      default: "",
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
      default: "",
    },
    adminComment: {
      type: String,
      trim: true,
      default: "",
    },
    userResponse: {
      type: String,
      trim: true,
      default: "",
    },
    statusHistory: [{
      status: {
        type: String,
        enum: ["pending", "open", "resolved", "closed"],
        required: true,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Ticket", ticketSchema);
