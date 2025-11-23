import type { RequestHandler } from "express";
import { UniqueConstraintError, type InferAttributes } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/User.js";
import type { SignUpBody, SignInBody, RefreshBody } from "../schemas/auth.schema.js";

/**
 * 不把密碼回傳到前端
 * InferAttributes<User> 用來推斷 Model 中的所有屬性
 */
type UserAttrs = InferAttributes<User>;

export function pickSafeUser(
  u: InstanceType<typeof User>
): Omit<UserAttrs, "password"> {
  const plain = u.get({ plain: true });
  const { password, ...rest } = plain;
  return rest;
}

/**
 * 註冊
 */
export const signUp: RequestHandler = async (req, res, next) => {
  try {
    const { username, email, password } = req.body as SignUpBody;
    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
    });
    res.status(201).json({
      message: "sign up successful",
      user: pickSafeUser(newUser),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ error: "Email already in use" });
    }
    next(error);
  }
};

/**
 * 登入
 */
export const signIn: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as SignInBody;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Wrong email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "12h",
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // 把 refresh token hash 存 DB
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await user.save();

    res.status(200).json({
      message: `Login successful`,
      token,
      refreshToken,
      user: pickSafeUser(user),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Login failed",
      details: errorMessage,
    });
  }
};

/**
 * 刷新 access token (refresh token rotation)
 * POST /api/auth/refresh
 */
export const refresh: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as RefreshBody;
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token" });
    }

    // 先驗 refresh token 是否有效
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET!
      ) as jwt.JwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const userId = payload.userId as number;
    const user = await User.findByPk(userId);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: "Refresh token not recognized" });
    }

    // 比對 DB 裡存的 hash
    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) {
      return res.status(401).json({ error: "Refresh token mismatch" });
    }

    // 產新 access token + 新 refresh token
    const newToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "12h",
    });

    const newRefreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // 存新的 refresh hash，舊的作廢
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await user.save();

    return res.status(200).json({
      message: "Token refreshed",
      token: newToken,
      refreshToken: newRefreshToken,
      user: pickSafeUser(user),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Refresh failed", details: errorMessage });
  }
};


/**
 * 登出：清掉 refreshTokenHash
 * POST /api/auth/logout
 */
export const logout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as RefreshBody;
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token" });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET!
      ) as jwt.JwtPayload;
    } catch {
      // 就算 token 壞掉也回成功，避免洩漏資訊
      return res.status(200).json({ message: "Logout ok" });
    }

    const userId = payload.userId as number;
    const user = await User.findByPk(userId);
    if (user) {
      user.refreshTokenHash = null;
      await user.save();
    }

    return res.status(200).json({ message: "Logout ok" });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: "Logout failed", details: errorMessage });
  }
};