import { z } from "zod";

/**
 * 註冊
 */
export const signUpSchema = z.object({
  body: z
    .object({
      username: z.string().min(2).max(15),
      email: z.string().email().max(25),
      password: z.string().min(6).max(30),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});
export type SignUpBody = z.infer<typeof signUpSchema>["body"];

// 登入
export const signInSchema = z.object({
  body: z
    .object({
      email: z.string().email().max(25),
      password: z.string().min(6).max(30),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});
export type SignInBody = z.infer<typeof signInSchema>["body"];

// 登入
export const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string()
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});
export type RefreshBody = z.infer<typeof refreshSchema>["body"];
