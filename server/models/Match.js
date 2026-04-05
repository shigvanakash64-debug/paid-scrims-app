import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    entry: {
      type: Number,
      required: true, // Entry fee per player
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "disputed", "cancelled"],
      default: "pending",
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
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
