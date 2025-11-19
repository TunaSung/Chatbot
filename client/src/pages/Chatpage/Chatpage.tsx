import { useCallback, useEffect, useState } from "react";
import { sendMessage, getMessages } from "../../services/chat.service";
import type { Message } from "../../types/chat.type";
import { useAuth } from "../../components/Context/AuthContext";
import ConversationList from "./components/Feature/ConversationList";
import ChatHeader from "./components/Feature/ChatHeader";
import MessageList from "./components/Feature/MessageList";
import ChatInput from "./components/Feature/ChatInput";
import { useMediaQuery } from "react-responsive";

function ChatPage() {
  const { isAuthenticated, conv: conversations, refreshConvs } = useAuth();

  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const isBelow768 = useMediaQuery({ maxWidth: 767 });

  // 選擇聊天室時載入訊息
  useEffect(() => {
    if (!currentConvId) return;

    setError(null);
    const fetchMsg = async () => {
      try {
        const res = await getMessages(currentConvId);
        setMessages(res.messages);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Fetch messages failed"
        );
      }
    };
    fetchMsg();
  }, [currentConvId]);

  // 換聊天室換 id 跟清空 msg
  const handleSelectConversation = useCallback((id: number) => {
    setCurrentConvId(id);
    setMessages([]);
  }, []);

  // 新聊天室 id 丟 null 去後端才開新聊天室
  const handleNewChat = useCallback(() => {
    setCurrentConvId(null);
    setMessages([]);
  }, []);

  // 傳訊息
  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await sendMessage(input.trim(), currentConvId ?? undefined);

      const { conversationId, messages: newMessages } = res.result;

      setCurrentConvId(conversationId);
      setMessages((prev) => [...prev, ...newMessages]);
      setInput("");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      await refreshConvs();
      setLoading(false);
    }
  }, [input, currentConvId, isAuthenticated, refreshConvs]);

  useEffect(() => {
    !isBelow768 ? setIsAsideOpen(true) : setIsAsideOpen(false);
  }, [isBelow768]);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* 對話列表 start */}
      <ConversationList
        conversations={conversations}
        currentConvId={currentConvId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isBelow768={isBelow768}
        isOpen={isAsideOpen}
        setIsOpen={setIsAsideOpen}
      />
      {/* 對話列表 end */}

      {/* 聊天室 start */}
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          isBelow768 && isAsideOpen ? "opacity-50" : ""
        }`}
      >
        <ChatHeader isBelow768={isBelow768} setIsAsideOpen={setIsAsideOpen} />
        <div className="container-mid flex-1 flex flex-col min-h-0">
          <MessageList messages={messages} conversationId={currentConvId} />
          {error && (
            <div className="mx-3 px-3 py-2 text-xs text-red-600 bg-red-50">
              {error}
            </div>
          )}
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
