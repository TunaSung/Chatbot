import express, { type Express } from "express";
import path from "path";

export function registerStatic(app: Express) {
  const staticPath = path.resolve(process.cwd(), "public");

  app.use(express.static(staticPath));

  // SPA fallback：避開 /api/*
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}
