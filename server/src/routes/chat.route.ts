import { Router } from "express";
import authenticate from "../middlewares/JWT.js";
import { validate } from "../middlewares/validate.js";
import {
  postChat,
  postChatStream,
  listConversations,
  getMessages,
  deleteConversation,
  editConvTitle
} from "../handlers/chat.handler.js";
import { postChatSchema, editTitleSchema } from "../schemas/chat.schema.js";

const router = Router();

router.post("/", authenticate, validate(postChatSchema), postChat);
router.post("/stream", authenticate, validate(postChatSchema), postChatStream);
router.get("/conversations", authenticate, listConversations);
router.get("/conversations/:id/messages", authenticate, getMessages);
router.delete("/conversations/:id/delete", authenticate, deleteConversation)
router.post("/conversations/update", authenticate, validate(editTitleSchema), editConvTitle)

export default router;
