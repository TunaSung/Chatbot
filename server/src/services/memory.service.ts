import { Memory, Message } from "../models/Association.js";
import { openai } from "../config/openai.js";

/**
 * 把存起來的長期記憶拿出來
 */
export async function getUserMemories(userId: number, limit = 10) {
  const memories = await Memory.findAll({
    where: { userId },
    order: [
      ["importance", "DESC"],
      ["lastUsedAt", "DESC"],
    ],
    limit,
  });

  if (!memories.length) return null;

  const content =
    "以下是關於此使用者的長期記憶，請在適當時機運用這些資訊：" +
    "\n" +
    memories.map((m, i) => `${i + 1}. ${m.content}`).join("\n");

  return { memories, content };
}

/**
 * 有值得放進長期記憶的重點就放進料庫
 */
export async function extractAndSaveMemories(
  userId: number,
  conversationId: number,
  newMessages: Message[]
) {
  /**
   * 抓這個對話裡最新幾則訊息
   */
  const recent = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "DESC"]],
    limit: 8,
  });
  const recentAsc = recent.reverse();

  /**
   * 組成給 AI 的文字
   * user: ~~~
   * assistant: okok
   * user: !!!
   */
  const textBlock = recentAsc
    .map((m) => `${m.role === "user" ? "user" : "assistant"}：${m.content}`)
    .join("\n");

  const MEMORY_PROMPT = `
    你是一個協助從對話中擷取「長期記憶」的小助理。

    請閱讀下面的對話片段，找出對未來互動有用、且在一段時間內都不太會改變的資訊，例如：
    - 使用者的背景（職業、科系、角色）
    - 使用者的偏好（風格、格式、常用技術）
    - 使用者的長期目標或習慣設定
    - 對此聊天機器人的偏好設定

    請用 JSON 陣列回覆，每個元素長這樣：
    {
      "content": "要記住的事項（繁體中文）",
      "importance": 1~5 的整數
    }

    如果沒有適合的長期記憶，請回傳空陣列 []。
    只回傳 JSON，不要加任何解釋文字。
    `.trim();

  /**
   * Prompt 丟給 Open ai
   */
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [
      { role: "system", content: MEMORY_PROMPT },
      { role: "user", content: textBlock },
    ],
    temperature: 0,
  });

  /**
   * 沒有適合的長期記憶回傳空陣列 []
   * 有的話 parse JSON 存進 Memory
   */
  const raw = completion.choices[0]?.message?.content ?? "[]";

  let parsed: Array<{ content: string; importance: number }> = [];
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("parse memory json failed", raw);
    return;
  }

  if (!Array.isArray(parsed) || !parsed.length) return;

  for (const m of parsed) {
    if (!m.content || typeof m.content !== "string") continue;

    await Memory.create({
      userId,
      content: m.content,
      importance:
        typeof m.importance === "number"
          ? Math.min(5, Math.max(1, m.importance))
          : 3,
      sourceConversationId: conversationId,
      sourceMessageId: newMessages[newMessages.length - 1]?.id ?? null,
    });
  }
}
