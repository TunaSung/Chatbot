/**
 * 去掉多的空行、空白、尾巴標點符號
 */
export function normalizeMemoryContent(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[。．\.!?！？]+$/u, "")
    .trim();
}

/**
 * Levenshtein 距離
 * 從 a 變到 b 要修改多少字元
 * 越小越像
 * 類似 Leetcode 72
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i]![0] = i;

  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = dp[i - 1]?.[j] ?? 0 + 1;
      const insert = dp[i]?.[j - 1] ?? 0 + 1;
      const rep = dp[i - 1]?.[j - 1] ?? 0 + cost;

      dp[i]![j] = Math.min(
        del, // 刪除
        insert, // 插入
        rep // 取代
      );
    }
  }

  return dp[m]?.[n] ?? 0;
}

/**
 * 把距離換成 0 ~ 1
 */
function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

/**
 * 計算共同前綴長度（以字元為單位）
 * 從開頭一直比到不一樣為止
 * 後面 前綴很長且占比夠高 就視為同一個
 */
function commonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) {
    i++;
  }
  return i;
}

/**
 * 判斷要不要合併成同一條記憶
 */
export function isSimilarMemory(aRaw: string, bRaw: string): boolean {
  const a = normalizeMemoryContent(aRaw);
  const b = normalizeMemoryContent(bRaw);

  if (!a || !b) return false;
  if (a === b) return true; // 完全一樣直接合併

  const minLen = Math.min(a.length, b.length);

  // 規則一：前綴很長且占比夠高 → 視為同一個
  const prefixLen = commonPrefixLength(a, b);
  if (prefixLen >= 6 && prefixLen >= minLen * 0.4) {
    return true;
  }

  // 規則二：句子偏長且整體相似度高才算
  if (minLen >= 15) {
    const sim = stringSimilarity(a, b);
    if (sim >= 0.9) {
      return true;
    }
  }

  return false;
}
