import type { RequestHandler } from "express";
import { UniqueConstraintError, type InferAttributes } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/User.js";
import type { SignUpBody, SignInBody } from "../schemas/auth.schema.js";

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
      {
        expiresIn: "7d",
      }
    );

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
