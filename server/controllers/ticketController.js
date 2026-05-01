import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

export const raiseTicket = async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    const userId = req.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Ticket message is required." });
    }

    const ticket = await Ticket.create({
      user: userId,
      subject: subject?.trim() || "Issue with my match",
      message: message.trim(),
      priority: priority || "medium",
    });

    const user = await User.findById(userId).select("username email");

    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        user: {
          id: user?._id,
          username: user?.username,
          email: user?.email,
        },
      },
    });
  } catch (error) {
    console.error("raiseTicket error:", error);
    res.status(500).json({ error: error.message || "Unable to raise ticket." });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("user", "username email");

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error("getUserTickets error:", error);
    res.status(500).json({ error: error.message || "Unable to load tickets." });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .populate("user", "username email");

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error("getAllTickets error:", error);
    res.status(500).json({ error: error.message || "Unable to load tickets." });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, adminComment } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    if (status && ["pending", "open", "resolved", "closed"].includes(status)) {
      ticket.status = status;
    }
    if (adminComment !== undefined) {
      ticket.adminComment = adminComment;
    }

    await ticket.save();

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    res.status(500).json({ error: error.message || "Unable to update ticket." });
  }
};
