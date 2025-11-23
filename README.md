# ChatBot Demo（React + TypeScript + Express + MySQL + OpenAI）

一個具備多聊天室（Conversation）記憶的聊天機器人 Web App。  
支援建立新對話、歷史對話列表、訊息即時顯示與 AI 思考中 loading、編輯/刪除對話、快速回到底部等功能，並完成 Docker 化與 Railway 部署。

## Live Demo
- Production (Railway): https://chatbot-production-2f6a.up.railway.app/

---

## Features
- 使用者登入/登出（JWT）
- 建立新對話（conversationId 可為 null）
- 歷史對話列表（依 `updatedAt` 倒序）
- 訊息送出 UX：使用者訊息立即先顯示 → AI thinking loading → AI 回覆後更新
- 切換聊天室：首次進入不 smooth、直接定位到底部
- 上滑後顯示「回到底部」浮動按鈕
- 編輯對話標題
- 刪除對話
- Docker Compose 一鍵啟動（MySQL + Server）
- Railway 部署

---

## Tech Stack
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Sequelize
- Database: MySQL 8
- AI: OpenAI Chat Completions API
- DevOps: Docker / Docker Compose / Railway

---

## Prerequisites
- Node.js >= 20
- npm >= 9
- Docker & Docker Compose（若使用 Docker 啟動）

---

## Installation & Run（Local）

### 1) Clone
```bash
git clone <your-repo>
cd Chatbot
```

### 2) Backend（Express）
```bash
cd server
npm ci
npm run dev
```

後端預設：
- http://localhost:8080

### 3) Frontend（Vite）
```bash
cd ../client
npm ci
npm run dev
```

前端預設：
- http://localhost:5173

---

## Run with Docker（Production Build）

> 你的 compose 參數插值來自 `.env.docker`，啟動請帶 `--env-file`。

### 1) 建立 `.env.docker`
參考 `.env.example`，填入你的值（**不要提交到 Git**）。

### 2) Build & Up
```bash
docker compose --env-file .env.docker up -d --build
```

### 3) Stop & Clean（含 DB volume）
```bash
docker compose down -v
```

---

## Environment Variables

請參考 `.env.example`。

---

## Project Structure（簡）
```
Chatbot/
 ├─ client/                 # React + Vite
 ├─ server/                 # Express + Sequelize
 ├─ docs/                   # API files
 │   ├─ api.md
 │   └─ openapi.yaml
 ├─ Dockerfile
 ├─ docker-compose.yml
 ├─ docker-compose.dev.yml
 ├─ .env.example
 └─ README.md
```

---

## API Overview

Base URL:
- Local / Docker: `http://localhost:8080`
- Production: `https://chatbot-production-2f6a.up.railway.app`

Auth:
- `POST   /sign/signup`
- `POST   /sign/signin`

Chat:
- `POST   /chat`
- `GET    /chat/conversations`
- `GET    /chat/conversations/:id/messages`
- `DELETE /chat/conversations/:id/delete`
- `POST   /chat/conversations/update`

完整規格請見：`docs/api.md`  
OpenAPI/Swagger 規格：`docs/openapi.yaml`

---

## Deployment Notes（Railway）

1. 將專案推到 GitHub
2. Railway 新增 Project → Deploy from GitHub
3. 建立 MySQL Plugin
4. 在 Railway Variables 設定：
   - `MYSQL_URL`（Railway MySQL 提供）
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `JWT_SECRET`
   - `REFRESH_SECRET`
   - `CORS_ORIGINS`
   - `NODE_ENV=production`
5. Railway 會自動注入 `PORT`，server 讀取後啟動

---

## License
MIT
