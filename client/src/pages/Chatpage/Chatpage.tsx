import { useCallback, useEffect, useRef, useState } from "react";
import { streamMessage, getMessages } from "../../services/chat.service";
import type { Message } from "../../types/chat.type";
import { useAuth } from "../../components/Context/AuthContext";
import ConversationList from "./components/Feature/ConversationList";
import ChatHeader from "./components/Feature/ChatHeader";
import MessageList from "./components/Feature/MessageList";
import ChatInput from "./components/Feature/ChatInput";
import { useMediaQuery } from "react-responsive";
import { toast } from 'react-toastify'

function ChatPage() {
  const { conv: conversations, refreshConvs } = useAuth();

  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const skipNextConversationFetchRef = useRef(false);

  const isBelow768 = useMediaQuery({ maxWidth: 767 });
  const actualAsideOpen = !isBelow768 || isAsideOpen;

  // 選擇聊天室時載入訊息
  useEffect(() => {
    if (!currentConvId) return;
    if (skipNextConversationFetchRef.current) {
      skipNextConversationFetchRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);

    let active = true;
    const getMsg = async () => {
      try {
        const res = await getMessages(currentConvId);
        if (active) setMessages(res.messages);
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : "Fetch messages failed");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void getMsg();
    return () => {
      active = false;
    };
  }, [currentConvId]);


  // 錯誤訊息
  useEffect(() => {
    if (!error) return;
    toast.error(error, { toastId: 'chat-error' }); // toastId 防止重複跳很多個
  }, [error]);

  // 換聊天室換 id 跟清空 msg
  const handleSelectConversation = useCallback((id: number) => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setCurrentConvId(id);
    setMessages([]);
    if (isBelow768) setIsAsideOpen(false);
  }, [isBelow768]);

  // 新聊天室 id 丟 null 去後端才開新聊天室
  const handleNewChat = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setCurrentConvId(null);
    setMessages([]);
    setLoading(false);
    if (isBelow768) setIsAsideOpen(false);
  }, [isBelow768]);

  /**
   * 傳訊息
   * 先顯示使用者訊息與空的助理訊息，再把 SSE delta 依序附加到助理訊息。
   */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setLoading(true);
    setInput("");

    const tempId = -Date.now();
    const tempAssistantId = tempId - 1;
    const now = new Date().toISOString();
    const tempUserMsg: Message = {
      id: tempId,
      conversationId: currentConvId ?? -1,
      role: "user",
      content: text,
      createdAt: now,
      updatedAt: now,
    };
    const tempAssistantMsg: Message = {
      id: tempAssistantId,
      conversationId: currentConvId ?? -1,
      role: "assistant",
      content: "",
      createdAt: now,
      updatedAt: now,
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    const abortController = new AbortController();
    streamAbortRef.current = abortController;
    let conversationReady = false;

    try {
      await streamMessage(
        text,
        currentConvId ?? undefined,
        {
          onReady: (conversationId, userMessage) => {
            conversationReady = true;
            if (currentConvId !== conversationId) {
              skipNextConversationFetchRef.current = true;
            }
            setCurrentConvId(conversationId);
            setMessages((prev) =>
              prev.map((item) => {
                if (item.id === tempId) return userMessage;
                if (item.id === tempAssistantId) {
                  return { ...item, conversationId };
                }
                return item;
              })
            );
          },
          onDelta: (content) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === tempAssistantId
                  ? { ...item, content: item.content + content }
                  : item
              )
            );
          },
          onComplete: (assistantMessage) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === tempAssistantId ? assistantMessage : item
              )
            );
          },
        },
        abortController.signal
      );

    } catch (err) {
      if (!abortController.signal.aborted) {
        setMessages((prev) =>
          prev.filter((item) => item.id !== tempAssistantId)
        );
        setError(err instanceof Error ? err.message : "Send failed");
      }
    } finally {
      if (streamAbortRef.current === abortController) {
        streamAbortRef.current = null;
        setLoading(false);
      }
      if (conversationReady) await refreshConvs();
    }
  }, [input, currentConvId, loading, refreshConvs]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* 對話列表 start */}
      <ConversationList
        conversations={conversations}
        currentConvId={currentConvId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isBelow768={isBelow768}
        isOpen={actualAsideOpen}
        setIsOpen={setIsAsideOpen}
      />
      {/* 對話列表 end */}

      {/* 聊天室 start */}
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          isBelow768 && actualAsideOpen ? "opacity-50" : ""
        }`}
      >
        <ChatHeader isBelow768={isBelow768} setIsAsideOpen={setIsAsideOpen} />
        <div className="container-mid flex-1 flex flex-col min-h-0">
          <MessageList
            isLoading={loading}
            messages={messages}
            conversationId={currentConvId}
          />
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={loading}
            />
        </div>
      </main>
      {/* 聊天室 end */}
    </div>
  );
}

export default ChatPage;
