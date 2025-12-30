import { Router } from "express";
import {
  getConversation,
  getConversationMessages,
  listConversations,
  postCustomerMessage,
  postSupportReply,
  deleteConversation,
} from "../controllers/supportController.js";

const router = Router();

// Customer side
router.get("/conversation", getConversation);
router.post("/message", postCustomerMessage);

// Support agent side
router.get("/inbox", listConversations);
router.get("/conversations/:conversation_id/messages", getConversationMessages);
router.post("/conversations/:conversation_id/reply", postSupportReply);
router.delete("/conversations/:conversation_id", deleteConversation);

export default router;
