import api, {
  API_BASE_URL,
  refreshAccessToken,
} from "./api";
import type { SendMsgRep, FetchConversationsRep, FetchMessagesRep, DeleteConvRep, EditTileRep } from "../types/chat.type";
import { getErrorMessage } from "../utils/service";
import { getAccessToken } from "./token";
import { readEventStream } from "./sse";
import type { Message } from "../types/chat.type";

type StreamMessageHandlers = {
  onReady: (conversationId: number, userMessage: Message) => void;
  onDelta: (content: string) => void;
  onComplete: (assistantMessage: Message) => void;
};

async function openChatStream(
  token: string,
  message: string,
  conversationId: number | undefined,
  signal: AbortSignal
) {
  return fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, conversationId }),
    signal,
  });
}

export async function streamMessage(
  message: string,
  conversationId: number | undefined,
  handlers: StreamMessageHandlers,
  signal: AbortSignal
): Promise<void> {
  let token = getAccessToken();
  if (!token) throw new Error("請重新登入後再試。");

  let response = await openChatStream(token, message, conversationId, signal);
  if (response.status === 401) {
    token = await refreshAccessToken();
    response = await openChatStream(token, message, conversationId, signal);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Send msg failed (${response.status})`);
  }
  if (!response.body) {
    throw new Error("瀏覽器不支援串流回覆。");
  }

  let completed = false;
  await readEventStream(response.body, ({ event, data }) => {
    if (event === "ready") {
      const payload = data as {
        conversationId: number;
        userMessage: Message;
      };
      handlers.onReady(payload.conversationId, payload.userMessage);
    } else if (event === "delta") {
      handlers.onDelta((data as { content: string }).content);
    } else if (event === "complete") {
      handlers.onComplete((data as { assistantMessage: Message }).assistantMessage);
    } else if (event === "done") {
      completed = true;
    } else if (event === "error") {
      throw new Error((data as { message?: string }).message ?? "串流回覆失敗");
    }
  });

  if (!completed) {
    throw new Error("串流連線提早中斷，請稍後再試。");
  }
}

export const sendMessage = async (
  message: string,
  conversationId?: number
): Promise<SendMsgRep> => {
  try {
    const res = await api.post("/chat", {
      message,
      conversationId
    })
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Send msg failed"), { cause: error })
  }
}

export const getConversations = async (): Promise<FetchConversationsRep> => {
  try {
    const res = await api.get("/chat/conversations")
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Fetch Conversations failed"), { cause: error })
  }
}

export const getMessages = async(
  conversationId: number
): Promise<FetchMessagesRep> => {
  try {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Fetch Msgs failed"), { cause: error })
  }
}

export const deleteConv = async(
  conversationId: number
): Promise<DeleteConvRep> => {
  try {
    const res = await api.delete(`/chat/conversations/${conversationId}/delete`)
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Delete Conv failed"), { cause: error })
  }
}

export const editTile = async(
  title: string,
  id: number
): Promise<EditTileRep> => {
  try {
    const res = await api.post(`/chat/conversations/update`, {title, id})
    return res.data
  } catch (error) {
    throw new Error(getErrorMessage(error, "Update Title failed"), { cause: error })
  }
}
