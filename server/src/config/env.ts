import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  MYSQL_URL: z.string().min(1, "MYSQL_URL is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.6-terra"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  REFRESH_SECRET: z.string().min(1, "REFRESH_SECRET is required"),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  origins: parsed.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
};
export type Env = typeof env;
