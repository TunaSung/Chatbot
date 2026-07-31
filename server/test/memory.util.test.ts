import assert from "node:assert/strict";
import test from "node:test";
import {
  isSimilarMemory,
  normalizeMemoryContent,
} from "../src/services/utils/memory.util.ts";

test("normalizes trailing punctuation and repeated whitespace", () => {
  assert.equal(normalizeMemoryContent("  喜歡   TypeScript！！ "), "喜歡 TypeScript");
});

test("does not merge unrelated memories of similar length", () => {
  assert.equal(
    isSimilarMemory("使用者偏好使用 TypeScript 開發後端服務", "使用者每週固定安排三天進行重量訓練"),
    false
  );
});

test("merges nearly identical long memories", () => {
  assert.equal(
    isSimilarMemory("使用者偏好使用 TypeScript 開發後端服務", "使用者偏好使用 TypeScript 開發後端應用"),
    true
  );
});
