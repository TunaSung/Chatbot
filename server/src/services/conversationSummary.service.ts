import { ConversationSummary } from "../models/ConversationSummary.js";
import { Message } from "../models/Association.js";
import { openai } from "../config/openai.js";

/**
 * 取得單一聊天室的 summary
 */
export async function getConversationSummary(conversationId: number) {
  const summary = await ConversationSummary.findOne({
    where: { conversationId },
  });

  if (!summary) return null;

  return {
    summary,
    content:
      "以下是本對話較早期內容的整理摘要，可視為舊訊息的壓縮版本：" +
      "\n" +
      summary.summary,
  };
}

export async function updateConversationSummaryIfNeeded(
  conversationId: number
) {
  /**
   * 先看有幾則訊息
   */
  const totalCount = await Message.count({ where: { conversationId } });
  const existing = await ConversationSummary.findOne({
    where: { conversationId },
  });

  /**
   * 如果有 summary (existing) 了
   * 自上次做摘要以來，新加進來的訊息數還沒超過 THRESHOLD 則，就不用重算
   * 避免每聊一句就重算一次 summary，浪費 token 跟時間
   */
  const THRESHOLD = 30;
  if (existing && totalCount - existing.messageCountAtLastSummary < THRESHOLD) {
    return;
  }

  /**
   * 真的要重算時
   * 抓整段對話文字
   * 組成給 AI 的文字
   * user: ~~~
   * assistant: okok
   * user: !!!
   */
  const allMsgs = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
  const dialogText = allMsgs
    .map((m) => `${m.role === "user" ? "user" : "assistant"}：${m.content}`)
    .join("\n");

  /**
   * 讓 AI 做摘要版聊天紀錄
   */
  const SUMMARY_PROMPT = `
    請將以下對話內容整理成一段簡短摘要，保留：
    - 使用者的需求、目標
    - 已經做過/決定過的事情
    - 重要的背景資訊或設定

    請用繁體中文輸出，條列或短段落皆可，長度控制在 200 字以內。
    `.trim();

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [
      { role: "system", content: SUMMARY_PROMPT },
      { role: "user", content: dialogText },
    ],
    temperature: 0.2,
  });

  const summaryText = completion.choices[0]?.message?.content?.trim();
  if (!summaryText) return;

  /**
   * 更換或建立 ConversationSummary 資訊
   */
  if (existing) {
    existing.summary = summaryText;
    existing.messageCountAtLastSummary = totalCount;
    await existing.save();
  } else {
    await ConversationSummary.create({
      conversationId,
      summary: summaryText,
      messageCountAtLastSummary: totalCount,
    });
  }
}
