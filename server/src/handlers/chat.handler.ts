import type { RequestHandler } from "express";
import { handleChat, streamChat } from "../services/chat.service.js";
import { Conversation, Message } from "../models/Association.js";
import { writeSseEvent } from "../utils/sse.js";
import {
  deleteConversationParamsSchema,
  getMessagesParamsSchema,
  getMessagesQuerySchema,
  type postChatBody,
  type EditTitleBody,
} from "../schemas/chat.schema.js";
import { Op } from "sequelize";

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

export const postChatStream: RequestHandler = async (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(": connected\n\n");

  const abortController = new AbortController();
  const abortIfDisconnected = () => {
    if (!res.writableEnded) abortController.abort();
  };
  req.once("aborted", abortIfDisconnected);
  res.once("close", abortIfDisconnected);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(": keep-alive\n\n");
    }
  }, 15_000);

  try {
    const { message, conversationId } = req.body as postChatBody;
    for await (const event of streamChat(
      req.user.id,
      conversationId,
      message,
      abortController.signal
    )) {
      const { type, ...data } = event;
      await writeSseEvent(res, type, data);
    }
  } catch (error) {
    if (!abortController.signal.aborted) {
      console.error("Chat stream failed", error);
      await writeSseEvent(res, "error", {
        message: "串流回覆失敗，請稍後再試。",
      });
    }
  } finally {
    clearInterval(heartbeat);
    req.off("aborted", abortIfDisconnected);
    res.off("close", abortIfDisconnected);
    if (!res.writableEnded && !res.destroyed) res.end();
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

    // 解析 query：limit / cursor
    const { limit: rawLimit, cursor: rawCursor } = getMessagesQuerySchema.parse(req.query);
    
    // 先設個上限
    const limit = rawLimit ? Math.min(rawLimit, 50) : 20;
    const cursor = rawCursor ?? null;

    const conv = await Conversation.findOne({
      where: { id, userId },
    });
    if (!conv) {
      return res.status(404).json({ message: "Not found" });
    }

    // 組 where 條件
    const where = {
      conversationId: conv.id,
      ...(cursor ? { id: { [Op.lt]: cursor } } : {}),
    };

    // 撈資料：多撈一筆來判斷 hasMore
    const rows = await Message.findAll({
      where,
      order: [["id", "DESC"]], // 先用 id DESC 撈：新的在前
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;

    // 回傳前反轉成「舊 → 新」
    const messagesAsc = sliced.reverse();

    const nextCursor = hasMore ? messagesAsc[0]?.id ?? null : null; // 這批裡「最舊」那一則

    return res.status(200).json({
      message: "已取得訊息",
      messages: messagesAsc,
      hasMore,
      nextCursor,
    });
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
