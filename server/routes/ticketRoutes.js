import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { raiseTicket, getUserTickets } from "../controllers/ticketController.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/", raiseTicket);
router.get("/", getUserTickets);

export default router;
