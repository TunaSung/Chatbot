import { Memory, Message } from "../models/Association.js";
import {
  normalizeMemoryContent,
  isSimilarMemory,
} from "./utils/memory.util.js";
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
   * 抓近幾則訊息出來
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

  /**
   * 整理一輪新技藝的候選
   * 先在同一輪裡去重複
   * ↓
   * 同樣 content 合併 importance 取最大
   */
  const candidateMap = new Map<string, number>(); // Map<normalizedContent, importance>

  for (const m of parsed) {
    if (!m || typeof m.content !== "string") continue;
    const normalized = normalizeMemoryContent(m.content);
    if (!normalized) continue;

    const rawImportance = typeof m.importance === "number" ? m.importance : 3;
    const importance = Math.min(5, Math.max(1, rawImportance));

    /**
     * 看看這個 normalizedContent 在這一輪裡是否出現過
     * 第一次出現把 normalized, importance 放入
     * 不是第一次的話 importance 取最大的用
     */
    // 
    const prev = candidateMap.get(normalized);
    if (prev != null) {
      candidateMap.set(normalized, Math.max(prev, importance));
    } else {
      candidateMap.set(normalized, importance);
    }
  }

  if (candidateMap.size === 0) return;

  const latestMsgId = newMessages[newMessages.length - 1]?.id ?? null;

  /**
   * 撈出 user 目前的現有記憶
   */
  const existingMemories = await Memory.findAll({
    where: { userId },
  });

  /**
   * 對每一個候選記憶，找一條最相似的現有記憶
   * 相似度超過門檻就合併
   */
  for (const [normalizedContent, importance] of candidateMap.entries()) {
    // 先在現有記憶中找最像的那一條
    let bestMatch: Memory | null = null;

    /**
     * 用 isSimilarMemory 判斷下面兩個 content 要不要合併成同一條記憶
     * mem.content: 使用者 memory 裡的 content
     * normalizedContent: 這一輪檢查的 content
     */
    for (const mem of existingMemories) {
      if (isSimilarMemory(mem.content, normalizedContent)) {
        bestMatch = mem;
        break; // 先直接認定，後續還有規則的話再加
      }
    }

    // bestMatch 有值(要合併的話) 更新那條現有記憶
    if (bestMatch) {
      // 更新 importance
      const newImportance = Math.max(bestMatch.importance, importance);

      await bestMatch.update({
        content: normalizedContent,
        importance: newImportance,
        sourceConversationId: conversationId,
        sourceMessageId: latestMsgId ?? bestMatch.sourceMessageId,
      });
    } else {
      // 沒有任何一條夠像就直接新增一筆記憶
      const created = await Memory.create({
        userId,
        content: normalizedContent,
        importance,
        sourceConversationId: conversationId,
        sourceMessageId: latestMsgId,
      });

      // 靶新的記憶下入陣列讓後續迴圈能讀到
      existingMemories.push(created);
    }
  }
}
