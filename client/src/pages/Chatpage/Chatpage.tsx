import { useCallback, useEffect, useState } from "react";
import { sendMessage, getMessages } from "../../services/chat.service";
import type { Message } from "../../types/chat.type";
import { useAuth } from "../../components/Context/AuthContext";
import ConversationList from "./components/Feature/ConversationList";
import ChatHeader from "./components/Feature/ChatHeader";
import MessageList from "./components/Feature/MessageList";
import ChatInput from "./components/Feature/ChatInput";
import { useMediaQuery } from "react-responsive";
import { toast } from 'react-toastify'

function ChatPage() {
  const { isAuthenticated, conv: conversations, refreshConvs } = useAuth();

  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [preMsg, setPreMsg] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const isBelow768 = useMediaQuery({ maxWidth: 767 });

  // 選擇聊天室時載入訊息
  useEffect(() => {
    if (!currentConvId) return;
    setLoading(true);
    setPreMsg([]);
    setError(null);

    const getMsg = async () => {
      try {
        const res = await getMessages(currentConvId);
        setMessages(res.messages);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Fetch messages failed");
      } finally {
        setLoading(false);
      }
    };
    getMsg();
  }, [currentConvId]);


  // 錯誤訊息
  useEffect(() => {
    if (!error) return;
    toast.error(error, { toastId: 'chat-error' }); // toastId 防止重複跳很多個
  }, [error]);

  // 換聊天室換 id 跟清空 msg
  const handleSelectConversation = useCallback((id: number) => {
    setCurrentConvId(id);
    setMessages([]);
    setPreMsg([]);
    isBelow768 ? setIsAsideOpen(false) : null;
  }, [isBelow768]);

  // 新聊天室 id 丟 null 去後端才開新聊天室
  const handleNewChat = useCallback(() => {
    setCurrentConvId(null);
    setMessages([]);
    setPreMsg([]);
    isBelow768 ? setIsAsideOpen(false) : null;
  }, [isBelow768]);

  /**
   * 傳訊息
   * 把訊息分成後端抓的 message 跟「複製 message + 最新訊息」的 preMsg
   * AI 還在思考的時候就先呈現 preMsg
   */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setLoading(true);
    setInput("");

    const tempId = -Date.now();
    const tempUserMsg: Message = {
      id: tempId,
      conversationId: currentConvId ?? -1,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPreMsg((prev) => {
      const base = prev.length ? prev : messages;
      return [...base, tempUserMsg];
    });

    try {
      const res = await sendMessage(text, currentConvId ?? undefined);

      const { conversationId, messages: newMessages } = res.result;

      setCurrentConvId(conversationId);
      setMessages((prev) => [...prev, ...newMessages]);

      await refreshConvs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
      setPreMsg([]);
    }
  }, [input, currentConvId, loading, messages, isAuthenticated, refreshConvs]);

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
          <MessageList
            isLoading={loading}
            messages={messages}
            preMessages={preMsg}
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
