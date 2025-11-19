import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/Association.js";

interface AccessTokenPayload extends JwtPayload {
  userId: number;
}

const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res
        .status(401)
        .json({ code: "NO_TOKEN", message: "未提供身份驗證令牌" });
    }
    // 嚴格檢查標頭
    const [scheme, token] = auth.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({
          code: "BAD_SCHEME",
          message: "Authorization 格式錯誤（需為 Bearer）",
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ code: "SERVER_MISCONFIG", message: "未設定 JWT_SECRET" });
    }

    // 驗證 & 解碼
    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, secret) as AccessTokenPayload;
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        return res
          .status(401)
          .json({ code: "TOKEN_EXPIRED", message: "身份驗證令牌已過期" });
      }
      if (e instanceof jwt.NotBeforeError) {
        return res
          .status(401)
          .json({ code: "TOKEN_NOT_ACTIVE", message: "令牌尚未生效" });
      }
      if (e instanceof jwt.JsonWebTokenError) {
        return res
          .status(401)
          .json({ code: "TOKEN_INVALID", message: "無效的身份驗證令牌" });
      }
      return res
        .status(401)
        .json({ code: "TOKEN_ERROR", message: "驗證令牌時發生錯誤" }); // 未知錯誤
    }

    // 目前只會用到 id
    const user = await User.findByPk(payload.userId, { attributes: ["id"] });
    if (!user) {
      return res
        .status(404)
        .json({ code: "USER_NOT_FOUND", message: "使用者不存在" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ code: "AUTH_UNKNOWN", message: "身份驗證失敗" });
  }
};

export default authenticate;
