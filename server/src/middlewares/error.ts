import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 先決定 HTTP 狀態碼
  // 如果錯誤物件有帶 status，就用它；否則預設 500 Internal Server Error
  const status = err.status ?? 500;

  // 回傳的 payload
  const payload: {
    message: string; // 錯誤訊息（給使用者看的）
    code: string; // 錯誤代碼（方便前端辨識）
    issues?: unknown; // 驗證錯誤細節（通常來自 Zod）
    stack?: string; // 錯誤堆疊（只在非 production 環境）
  } = {
    // 如果錯誤物件有 message 就用它，否則用預設字串
    message: err.message ?? "Internal Server Error",

    // 如果錯誤物件有 code 就用它，否則用 INTERNAL_ERROR
    code: err.code ?? "INTERNAL_ERROR",

    // 可選的 issues（例如 Zod schema 驗證失敗時的錯誤清單）
    issues: err.issues,
  };

  // 在非 production 環境，把錯誤堆疊附加到 payload（方便 debug）
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;

  // 設定 HTTP 狀態碼，並回傳 JSON 給前端
  res.status(status).json(payload);
};
