import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { openai } from "../config/openai.js";
import "dotenv/config";
import type { HandleChat } from "../schemas/chat.schema.js";

export async function handleChat(
  userId: number,
  conversationId: number | undefined,
  message: string
): Promise<HandleChat> {
  /**
   * 找或建立 conversation
   * 新建立的話( 沒有傳 convId 進來 )讓 AI 解析一下 message 內容來想對話 title
   */ 
  let conv: Conversation;
  if (!conversationId) {

    const SUGGEST_PROMPT = [
      "You are a concise assistant.",
      "Summarize the user's message into ONE short chat title in Traditional Chinese.",
      "Return ONLY the title text, no JSON, no quotes, no emoji.",
      "Title <= 12 characters.",
    ].join(" ");

    const suggestTitle = await openai.responses.create({
      model: process.env.OPENAI_MODEL!,
      input: [
        {
          role: "system",
          content: SUGGEST_PROMPT,
        },
        { role: "user", content: message },
      ],
      temperature: 0.3,
    });

    conv = await Conversation.create({
      userId,
      title: suggestTitle?.output_text || "新的聊天室",
    });
  } else {
    const found = await Conversation.findOne({
      where: { id: conversationId, userId },
    });
    if (!found) throw { status: 404, message: "找不到聊天紀錄" };
    conv = found;
  }

  /**
   * 存 user 訊息
   */
  const userMsg = await Message.create({
    conversationId: conv.id,
    role: "user",
    content: message,
  });

  /**
   * 取得上下文：拿最新 20 筆
   */
  const recentMsgs = await Message.findAll({
    where: { conversationId: conv.id },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });
  const recentMsgsAsc = recentMsgs.reverse();

  const PROMPT =
    "You are a helpful chatbot for a demo web app. Answer concisely in Traditional Chinese.";

  const openaiMsgs = [
    {
      role: "system" as const,
      content: PROMPT,
    },
    ...recentMsgsAsc.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    })),
  ];

  /**
   * OpenAi Api
   */
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: openaiMsgs,
    temperature: 0.3,
  });

  const replyContent =
    completion.choices[0]?.message?.content ?? "已停止思考，請稍後在試";

  /**
   * 存 AI 訊息
   */
  const aiMsg = await Message.create({
    conversationId: conv.id,
    role: "assistant",
    content: replyContent,
  });

  return {
    conversationId: conv.id,
    messages: [userMsg, aiMsg],
  };
}
