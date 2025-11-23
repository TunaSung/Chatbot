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
      "你是一位精簡扼要的助理。",
      "請將使用者的訊息總結成「一個」簡短的聊天標題，使用繁體中文。",
      "只回傳標題文字，不要輸出 JSON、不要加引號、不要使用表情符號。",
      "標題長度需 ≤ 12 個字。",
    ].join(" ");

    const suggestTitle = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: [
        { role: "system", content: SUGGEST_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.3,
    });

    conv = await Conversation.create({
      userId,
      title: suggestTitle.choices?.[0]?.message?.content?.trim() ?? "",
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

  const PROMPT = `
    你是 demo web app 的專業聊天助理，使用繁體中文簡潔回答。
    請先在內部思考，再輸出最終答案（不要展示你的思考過程）。

    優先規則：
    1) 只用對話提供的資訊；缺資訊就說不確定並追問。
    2) 不允許捏造任何事實、數據、來源。
    3) 回答以可執行、可落地為主；避免空泛建議。
  `.trim();

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
