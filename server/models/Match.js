import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    mode: {
      type: String,
      enum: ["1v1", "2v2", "3v3", "4v4"],
      required: true,
    },
    type: {
      type: String,
      enum: ["Headshot", "Bodyshot"],
      required: true,
    },
    prizePool: {
      type: Number,
      required: true,
    },
    entry: {
      type: Number,
      required: true, // Entry fee per player
    },
    status: {
      type: String,
      enum: ["waiting", "matched", "payment_pending", "verified", "ongoing", "completed", "cancelled", "pending", "in-progress", "disputed"],
      default: "waiting",
    },
    paidUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    paymentScreenshots: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        image: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentDueAt: Date,
    roomDetails: {
      roomId: String,
      password: String,
      createdAt: Date,
    },
    adminMessages: [
      {
        sender: {
          type: String,
          enum: ["admin", "user", "system"],
          default: "admin",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    canceledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    result: {
      submittedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      screenshots: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          image: String, // Cloudinary URL
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          metadata: {
            fileSize: Number,
            mimeType: String,
            dimensions: {
              width: Number,
              height: Number
            }
          }
        },
      ],
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      decidedAt: Date,
      paidOut: {
        type: Boolean,
        default: false,
      },
    },
    resultDeadline: Date, // Deadline for result submission
    startedAt: Date, // When match became "in-progress"
    isPaid: {
      type: Boolean,
      default: false, // Safety flag to prevent duplicate payouts
    },

    // Anti-cheat and dispute tracking
    disputes: [{
      raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      reason: {
        type: String,
        enum: ["fake_screenshot", "wrong_result", "no_result", "other"],
        required: true
      },
      description: String,
      evidence: [String], // Additional screenshot URLs
      status: {
        type: String,
        enum: ["pending", "resolved", "rejected"],
        default: "pending"
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Admin who resolved
      },
      resolvedAt: Date,
      decision: {
        type: String,
        enum: ["upheld", "rejected", "partial"]
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Screenshot validation
    screenshotHashes: [String], // Store hashes to prevent duplicates
    validationFlags: {
      duplicateDetected: { type: Boolean, default: false },
      suspiciousActivity: { type: Boolean, default: false },
      adminReviewed: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

// Index for efficient queries
matchSchema.index({ status: 1, resultDeadline: 1 });
matchSchema.index({ "disputes.status": 1 });

// Method to check for duplicate screenshots
matchSchema.methods.hasDuplicateScreenshot = function(newHash) {
  return this.screenshotHashes.includes(newHash);
};

// Method to add screenshot hash
matchSchema.methods.addScreenshotHash = function(hash) {
  if (!this.screenshotHashes.includes(hash)) {
    this.screenshotHashes.push(hash);
  }
};

// Method to raise a dispute
matchSchema.methods.raiseDispute = function(userId, reason, description, evidence = []) {
  this.disputes.push({
    raisedBy: userId,
    reason,
    description,
    evidence
  });

  this.status = "disputed";
  return this.save();
};

// Method to resolve dispute
matchSchema.methods.resolveDispute = function(disputeId, adminId, decision) {
  const dispute = this.disputes.id(disputeId);
  if (!dispute) throw new Error("Dispute not found");

  dispute.status = "resolved";
  dispute.resolvedBy = adminId;
  dispute.resolvedAt = new Date();
  dispute.decision = decision;

  // Update match status based on decision
  if (decision === "upheld") {
    // Keep disputed status or handle accordingly
  } else if (decision === "rejected") {
    this.status = "completed";
  }

  return this.save();
};

export default mongoose.model("Match", matchSchema);
