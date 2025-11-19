# ChatBot Demo

這是一個以前後端分離架構實作的聊天機器人 Demo

---

## 功能特色

- 多對話管理（Conversation）
  - 左側列表顯示所有對話，依最後更新時間排序
  - 新增對話、切換既有對話
  - 支援重新命名標題、刪除對話（連同底下訊息）

- 訊息歷史（Message）
  - 顯示使用者與機器人的對話紀錄
  - 切換對話時載入歷史訊息
  - 自動捲到最底部（新訊息 / 換房）＋ 往上捲時顯示「回到底部」按鈕

- 輸入體驗
  - 多行輸入框，會依內容自動增高
  - Enter 送出、Shift+Enter 換行
  - 防止中文輸入法組字時誤送出

- RWD & UX
  - 小螢幕使用側邊抽屜顯示對話列表（漢堡選單開合）
  - 桌機版為左側列表 + 右側聊天區
  - 訊息氣泡樣式區分 user / assistant，提升可讀性

> 備註：AI 回覆邏輯封裝在後端 `\src\services\chat.service.ts` 中，可依需求對接任意 LLM（例如 OpenAI API）。

---

## 技術棧

**Frontend**

- React + TypeScript
- Vite
- Tailwind CSS
- Context API（`AuthContext`：登入狀態 + 對話列表）
- Framer Motion（對話列表進出場動畫）
- Ant Design（Dropdown）＋ React Icons

**Backend**

- Node.js(Express) + TypeScript
- Sequelize + MySQL
- Zod 驗證（params / body）
- AI：OpenAI Responses API
- RESTful API：
  - `POST /api/chat`：發送訊息（建立 / 延續對話）
  - `GET /api/chat/conversations`：取得對話列表
  - `GET /api/chat/conversations/:id/messages`：取得對話訊息
  - `DELETE /api/chat/conversations/:id/delete`：刪除對話
  - `POST /api/chat/conversations/update`：更新對話標題

---
