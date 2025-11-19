import { z } from "zod";
import type { RequestHandler, Request, Response, NextFunction } from "express";

// 只接收 z.object(...)
type ThreePartSchema = z.ZodObject<{
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}>;

// validate: 接收一個 Zod 物件 schema，回傳 Express middleware
export const validate = <S extends ThreePartSchema>(
  schema: S
): RequestHandler => {
  return (req, _res, next) => {
    // 把 request 的 body, query, params 打包成一個物件
    // 方便 schema 可以同時驗證三個來源
    const data = {
      body: req.body ?? {}, // POST/PUT 資料
      query: req.query ?? {}, // URL 查詢字串 ?key=value
      params: req.params ?? {}, // 路由參數 /users/:id
    };

    // 用 Zod schema 驗證 data
    // safeParse → 不會 throw，而是回傳 { success, data | error }
    const parsed = schema.safeParse(data);

    // 驗證失敗 → 把錯誤丟給 next()，交給 errorHandler
    // parsed.error.issues: Zod 原始錯誤陣列（包含欄位路徑、訊息）
    if (!parsed.success) {
      return next({
        status: 400,
        code: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      });
    }

    // 驗證成功 → 直接放行，不會修改 req.body/query/params
    // 如果要自動覆蓋乾淨資料，可以額外寫 req.body = parsed.data.body）
    next();
  };
};
