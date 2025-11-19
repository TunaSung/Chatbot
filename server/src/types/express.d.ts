import type { User as UserModel } from "../models/Association.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
    }
  }
}

// 防止 TypeScript 將這個檔案視為一個全域的 script
export {};
