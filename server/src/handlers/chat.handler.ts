import type { RequestHandler } from "express";
import { handleChat } from "../services/chat.service.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import {
  deleteConversationParamsSchema,
  getMessagesParamsSchema,
  type postChatBody,
  type EditTitleBody,
} from "../schemas/chat.schema.js";

export const postChat: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user?.id;
    const { message, conversationId } = req.body as postChatBody;

    const result = await handleChat(userId, conversationId, message);

    res.status(200).json({ message: "處裡用戶發送訊息成功", result });
  } catch (error) {
    next(error);
  }
};

export const listConversations: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const convs = await Conversation.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      attributes: ["id", "title", "updatedAt"],
    });
    res.status(200).json({ message: "已找到用戶所有對話", convs });
  } catch (error) {
    next(error);
  }
};

export const getMessages: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = getMessagesParamsSchema.parse(req.params);

    const conv = await Conversation.findOne({
      where: { id, userId },
    });
    if (!conv) return res.status(404).json({ message: "Not found" });

    const messages = await Message.findAll({
      where: { conversationId: conv.id },
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json({ message: "已找到用戶該對話的全部訊息", messages });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = deleteConversationParamsSchema.parse(req.params);
    const conv = await Conversation.findOne({
      where: { id, userId },
    });

    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 有開 ON DELETE CASCADE ， msg 會一起砍
    await conv.destroy();

    return res.status(200).json({
      message: "刪除對話成功",
      conversationId: id,
    });
  } catch (error) {
    next(error);
  }
};

export const editConvTitle: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id, title } = req.body as EditTitleBody;
    const conv = await Conversation.findOne({
      where: { id, userId },
    });

    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conv.title = title.trim();
    await conv.save();

    return res.status(200).json({
      message: "更改名稱成功",
      conversationId: id,
    });
  } catch (error) {
    next(error);
  }
};
