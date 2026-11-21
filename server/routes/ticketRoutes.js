import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { raiseTicket, getUserTickets, getUserTicket } from "../controllers/ticketController.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/", raiseTicket);
router.get("/", getUserTickets);
router.get("/:ticketId", getUserTicket);

export default router;
