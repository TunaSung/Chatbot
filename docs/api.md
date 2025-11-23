# ChatBot Demo API

## Base URL
- Local / Docker: `http://localhost:8080`
- Production: `https://chatbot-production-2f6a.up.railway.app`

## Auth
若後端有啟用 JWT middleware，需在受保護路由帶上：
```
Authorization: Bearer <token>
```

---

## 1) Send Message
**POST `/chat`**

### Request Body
```json
{
  "message": "你好",
  "conversationId": 1
}
```
- `conversationId` 可省略或傳 `null` → 後端會建立新對話。

### Response
```json
{
  "message": "處裡用戶發送訊息成功",
  "result": {
    "conversationId": 1,
    "messages": [
      {
        "id": 10,
        "conversationId": 1,
        "role": "user",
        "content": "你好",
        "createdAt": "2025-11-23T00:00:00.000Z",
        "updatedAt": "2025-11-23T00:00:00.000Z"
      },
      {
        "id": 11,
        "conversationId": 1,
        "role": "assistant",
        "content": "嗨～有什麼我可以幫忙的嗎？",
        "createdAt": "2025-11-23T00:00:01.000Z",
        "updatedAt": "2025-11-23T00:00:01.000Z"
      }
    ]
  }
}
```

### Errors
- `404` 找不到對話（conversationId 不屬於該 user）
- `500` OpenAI / DB 例外

---

## 2) List Conversations
**GET `/chat/conversations`**

### Response
```json
{
  "message": "已找到用戶所有對話",
  "convs": [
    {
      "id": 1,
      "title": "你好",
      "updatedAt": "2025-11-23T00:00:01.000Z"
    }
  ]
}
```

---

## 3) Get Messages by Conversation
**GET `/chat/conversations/:conversationId/messages`**

### Path Params
- `conversationId`：number

### Response
```json
{
  "message": "已找到對話訊息",
  "messages": [
    {
      "id": 10,
      "conversationId": 1,
      "role": "user",
      "content": "你好",
      "createdAt": "2025-11-23T00:00:00.000Z",
      "updatedAt": "2025-11-23T00:00:00.000Z"
    }
  ]
}
```

### Errors
- `404` Not found（找不到該對話或不屬於該 user）

---

## 4) Update Conversation Title
**POST `/chat/conversations/update`**

### Request Body
```json
{
  "title": "新的標題",
  "conversationId": 1
}
```

### Response
```json
{
  "message": "Update title success",
  "conv": {
    "id": 1,
    "title": "新的標題",
    "updatedAt": "2025-11-23T00:10:00.000Z"
  }
}
```

### Errors
- `404` Not found（找不到該對話或不屬於該 user）
- `400` title 驗證失敗

---

## 5) Delete Conversation
**DELETE `/chat/conversations/:conversationId/delete`**

### Response
```json
{
  "message": "Delete conversation success"
}
```

### Errors
- `404` Not found（找不到該對話或不屬於該 user）

---

## Error Format（統一格式）
```json
{
  "error": "Something went wrong",
  "details": "reason..."
}
```
