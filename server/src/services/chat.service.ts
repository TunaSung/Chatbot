import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { openai } from "../config/openai.js";
import "dotenv/config";
import type { HandleChat } from "../schemas/chat.schema.js";
import {
  getUserMemories,
  extractAndSaveMemories,
} from "../services/memory.service.js";
import {
  getConversationSummary,
  updateConversationSummaryIfNeeded,
} from "../services/conversationSummary.service.js";

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
   * 取短期記憶 (最新 20 筆)
   */
  const recentMsgs = await Message.findAll({
    where: { conversationId: conv.id },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });
  const recentMsgsAsc = recentMsgs.reverse();

  // 取長期記憶 + 對話摘要
  const [memoryBlock, summaryBlock] = await Promise.all([
    getUserMemories(userId),
    getConversationSummary(conv.id),
  ]);

  const PROMPT = `
    你是 demo web app 的專業聊天助理，使用繁體中文回答。

    請先仔細思考，再輸出最終答案（不要描述你的思考過程）。

    回覆格式規則（非常重要）：
    1) 一律使用 Markdown 格式回答，可以使用標題、粗體、條列、表格與程式碼區塊。
    2) 回答如果超過 3 段，請務必有「明顯的標題結構」，遵守：
      - 只在最前面使用一個 \`##\` 作為主標題。
      - 主要段落用 \`###\` 作為小標題，例如：\`### 問題說明\`、\`### 解決步驟\`、\`### 範例程式碼\`。
      - 不要使用超過 \`###\` 的層級（避免 \`####\` 之後的標題）。
    3) 在條列清單中，若需要「小標題 + 說明文字」，請使用以下格式：
      - \`- **小標題**：說明內容...\`
      例如：\`- **原因**：可能是資料表沒有 createdAt 欄位。\`
    4) 如果提供程式碼，請使用對應語言的 fenced code block，例如：
      \`\`\`ts
      // TypeScript 範例
      \`\`\`
      或
      \`\`\`jsx
      // React 範例
      \`\`\`

    內容優先規則：
    1) 只用對話提供的資訊；如果資訊不足就說不確定並主動追問需要哪些細節。
    2) 不允許捏造任何事實、數據或來源。
    3) 回答以可執行、可落地為主，給出具體步驟或範例程式碼，避免空泛建議。
  `.trim();

  const openaiMsgs = [
    {
      role: "system" as const,
      content: PROMPT,
    },
    ...(memoryBlock
      ? [
          {
            role: "system" as const,
            content: memoryBlock.content,
          },
        ]
      : []),
    ...(summaryBlock
      ? [
          {
            role: "system" as const,
            content: summaryBlock.content,
          },
        ]
      : []),
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

  /**
   * 更新長期記憶＋摘要
   */
  await Promise.all([
    extractAndSaveMemories(userId, conv.id, [userMsg, aiMsg]),
    updateConversationSummaryIfNeeded(conv.id),
  ]);

  return {
    conversationId: conv.id,
    messages: [userMsg, aiMsg],
  };
}
