import type { RequestHandler } from "express";
import { UniqueConstraintError, type InferAttributes } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import type { SignUpBody, SignInBody, RefreshBody } from "../schemas/auth.schema.js";
import { env } from "../config/env.js";
import { omitPrivateUserFields } from "../services/utils/user.util.js";

/**
 * 不把密碼回傳到前端
 * InferAttributes<User> 用來推斷 Model 中的所有屬性
 */
type UserAttrs = InferAttributes<User>;

function createSessionTokens(userId: number) {
  return {
    token: jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "12h" }),
    refreshToken: jwt.sign({ userId }, env.REFRESH_SECRET, {
      expiresIn: "7d",
    }),
  };
}

export function pickSafeUser(
  u: InstanceType<typeof User>
): Omit<UserAttrs, "password" | "refreshTokenHash"> {
  return omitPrivateUserFields(u.get({ plain: true }));
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

    const { token, refreshToken } = createSessionTokens(user.id);

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
    console.error("Login failed", error);
    res.status(500).json({
      error: "Login failed",
    });
  }
};

/**
 * 驗證目前 refresh token 後進行 rotation。
 */
export const refresh: RequestHandler = async (req, res) => {
  const { refreshToken: currentRefreshToken } = req.body as RefreshBody;

  try {
    const payload = jwt.verify(
      currentRefreshToken,
      env.REFRESH_SECRET
    ) as jwt.JwtPayload;
    const userId = payload.userId;
    if (typeof userId !== "number") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findByPk(userId);
    if (
      !user?.refreshTokenHash ||
      !(await bcrypt.compare(currentRefreshToken, user.refreshTokenHash))
    ) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const nextTokens = createSessionTokens(user.id);
    user.refreshTokenHash = await bcrypt.hash(nextTokens.refreshToken, 12);
    await user.save();

    return res.status(200).json({
      message: "Token refreshed",
      ...nextTokens,
      user: pickSafeUser(user),
    });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

/**
 * 登出：清掉 refreshTokenHash
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
        env.REFRESH_SECRET
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
    console.error("Logout failed", e);
    return res.status(500).json({ error: "Logout failed" });
  }
};
