# ChatBot Demo API（統一版）

> 風格統一：所有端點都用相同模板描述（Path / Auth / Request / Response / Errors）。  
> Base URL 後面一律接 `/api`。

---

## Base URL
- Local / Docker：`http://localhost:8080`
- Production：`https://chatbot-production-2f6a.up.railway.app`

所有路由範例以下以：
```
{{BaseURL}}/api
```
表示。

---

## Auth（JWT + Refresh Rotation）

### 共同規則
**Access Token（12h）**
- 來源：`POST /auth/signin` 或 `POST /auth/refresh`
- 受保護路由 Header：
```
Authorization: Bearer <token>
```

**Refresh Token（7d）**
- 來源：`POST /auth/signin` 或 `POST /auth/refresh`
- Rotation：每次 refresh 都會回新的 refresh token，舊的立刻失效。

---

### 1) 註冊
**POST `/auth/signup`**  
**Auth：不需要**

#### Request Body
```json
{
  "username": "Test",
  "email": "test@gmail.com",
  "password": "12345678"
}
```

#### Response 200
```json
{
  "message": "sign up successful",
  "user": {
    "id": 5,
    "username": "Test",
    "email": "test@gmail.com",
    "createdAt": "2025-11-23T16:42:29.000Z",
    "updatedAt": "2025-11-23T16:42:29.000Z"
  }
}
```

#### Errors
- `400` Validation failed
- `409` Email already in use

---

### 2) 登入
**POST `/auth/signin`**  
**Auth：不需要**

#### Request Body
```json
{
  "email": "test@gmail.com",
  "password": "12345678"
}
```

#### Response 200
```json
{
  "message": "Login successful",
  "token": "<access_token>",
  "refreshToken": "<refresh_token>",
  "user": {
    "id": 5,
    "username": "Test",
    "email": "test@gmail.com",
    "createdAt": "2025-11-23T16:42:29.000Z",
    "updatedAt": "2025-11-23T16:59:22.635Z"
  }
}
```

#### Errors
- `401` Wrong email or password
- `500` Login failed

---

### 3) 刷新 Token（Renew + Rotation）
**POST `/auth/refresh`**  
**Auth：不需要（用 refreshToken）**

> 用 refresh token 換新的 access token。  
> 成功後回新的 access token + 新的 refresh token（rotation）。

#### Request Body
```json
{
  "refreshToken": "<refresh_token>"
}
```

#### Response 200
```json
{
  "message": "Token refreshed",
  "token": "<new_access_token>",
  "refreshToken": "<new_refresh_token>",
  "user": {
    "id": 5,
    "username": "Test",
    "email": "test@gmail.com"
  }
}
```

---

### 4) 登出（讓 refresh token 失效）
**POST `/auth/logout`**  
**Auth：不需要（用 refreshToken）**

#### Request Body
```json
{
  "refreshToken": "<refresh_token>"
}
```

#### Response 200
```json
{
  "message": "Logout ok"
}
```

---

### Auth 測試（手動貼值版 .http）
> 因為你目前的 `.http` runner 不會自動傳值，所以用手動貼值測。

```http
### signin
POST http://localhost:8080/api/auth/signin
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "12345678"
}

### refresh（貼剛剛 signin 回來的 refreshToken）
POST http://localhost:8080/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
}
```

---

## Chat（需登入）

### 共同規則
所有 Chat 端點都需要 Access Token：
```
Authorization: Bearer <token>
```

---

### 1) 傳送訊息
**POST `/chat`**  
**Auth：需要**

#### Request Body
```json
{
  "message": "你好",
  "conversationId": 1
}
```
- `conversationId` 可省略或傳 `null` → 會建立新對話。

#### Response 200
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

#### Errors
- `401` Unauthorized（token 過期時前端會自動 refresh）
- `404` Conversation not found / 不屬於該 user
- `500` OpenAI / DB exception

---

### 2) 取得所有對話
**GET `/chat/conversations`**  
**Auth：需要**

#### Response 200
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

### 3) 取得對話訊息
**GET `/chat/conversations/:conversationId/messages`**  
**Auth：需要**

#### Path Params
- `conversationId`：number

#### Response 200
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

#### Errors
- `401` Unauthorized
- `404` Not found（找不到或不屬於該 user）

---

### 4) 更新對話標題
**POST `/chat/conversations/update`**  
**Auth：需要**

#### Request Body
```json
{
  "title": "新的標題",
  "conversationId": 1
}
```

#### Response 200
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

#### Errors
- `401` Unauthorized
- `404` Not found
- `400` Title validation failed

---

### 5) 刪除對話
**DELETE `/chat/conversations/:conversationId/delete`**  
**Auth：需要**

#### Response 200
```json
{
  "message": "Delete conversation success"
}
```

#### Errors
- `401` Unauthorized
- `404` Not found

---

## Error Format（統一格式）
```json
{
  "error": "Something went wrong",
  "details": "reason..."
}
```
