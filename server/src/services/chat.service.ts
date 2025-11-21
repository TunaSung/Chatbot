import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { openai } from "../config/openai.js";
import "dotenv/config";
import type { HandleChat } from "../schemas/chat.schema.js";

export async function handleChat(
  userId: number,
  conversationId: number | undefined,
  message: string,
): Promise<HandleChat> {
  // 找或建立 conversation
  let conv: Conversation;
  if (!conversationId) {
    conv = await Conversation.create({
      userId,
      title: message.slice(0, 10) || "新聊天室",
    });
  } else {
    const found = await Conversation.findOne({
      where: { id: conversationId, userId },
    });
    if (!found) throw { status: 404, message: "找不到聊天紀錄" };
    conv = found;
  }

  // 存 user 訊息
  const userMsg = await Message.create({
    conversationId: conv.id,
    role: "user",
    content: message,
  });

  // 取得上下文
  const recentMsgs = await Message.findAll({
    where: { conversationId: conv.id },
    order: [["createdAt", "ASC"]],
    limit: 20,
  });

  const PROMPT =
    "You are a helpful chatbot for a demo web app. Answer concisely in Traditional Chinese.";

  const openaiMsgs = [
    {
      role: "system" as const,
      content: PROMPT,
    },
    ...recentMsgs.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    })),
  ];

  // OpenAi Api
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: openaiMsgs,
    temperature: 0.7,
  });

  const replyContent =
    completion.choices[0]?.message?.content ?? "已停止思考，請稍後在試";

  // 存 AI 訊息
  const aiMsg = await Message.create({
    conversationId: conv.id,
    role: "assistant",
    content: replyContent,
  });

  await conv.update({ updatedAt: new Date() });
  await conv.save()

  return {
    conversationId: conv.id,
    messages: [userMsg, aiMsg],
  };
}
