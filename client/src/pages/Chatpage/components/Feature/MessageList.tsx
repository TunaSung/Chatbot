import { useRef, useEffect, useState, type UIEvent } from "react";
import { motion } from "framer-motion";
import type { Message } from "../../../../types/chat.type";
import { FaArrowDown } from "react-icons/fa6";
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'

// Default values shown
<Bouncy
  size="45"
  speed="1.75"
  color="black" 
/>

type MessageListProps = {
  isLoading: boolean;
  messages: Message[];
  preMessages: Message[];
  conversationId: number | null;
};

function MessageList({
  isLoading,
  messages,
  preMessages,
  conversationId,
}: MessageListProps) {
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<number | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const displayMessages = isLoading ? preMessages : messages;

  /**
   * 剛進聊天室不 smooth 到底部
   * 點按當前的聊天室不做反應
   * 新訊息來了之後滑到底
   * TODO 之後可以考慮做成跟 ChatGPT 一樣訊息像是打字出來的一樣，並且慢慢往下滾
   */
  useEffect(() => {
    const el = msgContainerRef.current;
    if (!el) return;
    if (conversationId == null) return;
    if (messages.length === 0) return;

    const isConversationChanged = prevConvIdRef.current !== conversationId;

    if (isConversationChanged) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }

    prevConvIdRef.current = conversationId;
  }, [isLoading, messages, conversationId]);

  /**
   * 上滑超過 40px 就顯示滾動到底部的按鈕
   */
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const threshold = 40;
    setShowScrollToBottom(distanceFromBottom > threshold);
  };

  /**
   * 按了滾到聊天室底部
   */
  const scrollToBottom = () => {
    const el = msgContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  };

  /**
   * 沒歷史聊天紀錄顯示
   */
  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
          開始一個新的對話✨
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-0">
      {/* start msg */}
      <div
        ref={msgContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-3"
      >
        {displayMessages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm sm:text-xl md:text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white border rounded-bl-none"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* ✅ loading bubble */}
        {isLoading && (
          <span className="flex justify-self-start items-center gap-2 max-w-[70%] px-4 py-2 text-sm sm:text-xl md:text-sm">
            <p className="font-extrabold">
              正在思考中
            </p>
            <Bouncy size={20} />
          </span>
        )}
      </div>
      {/* end msg */}

      {/* start scroll btn */}
      {showScrollToBottom && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={scrollToBottom}
          className="absolute left-1/2 bottom-5 -translate-x-1/2 flex justify-center items-center w-8 aspect-square rounded-full
              bg-blue-600 text-white text-lg shadow-lg hover:bg-blue-700 transition duration-150"
        >
          <FaArrowDown />
        </motion.button>
      )}
      {/* end scroll btn */}
    </div>
  );
}

export default MessageList;
