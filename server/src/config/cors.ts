import cors from "cors";
import type { CorsOptions } from "cors";
import { env } from "./env.js";

const options: CorsOptions = {
  origin: env.origins,
  credentials: true,
};

export const corsMiddleware = cors(options);
