import { type Express } from "express";
import chatRouter from "./chat.route.js"
import authRouter from "./auth.route.js"

export function registerRoutes(app: Express){
    app.use("/api/auth", authRouter)
    app.use("/api/chat", chatRouter)

    app.get("/health", (_req, res) => res.send("OK"))
}