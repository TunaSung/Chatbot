import type { Conversation } from "../../../../types/chat.type";
import { motion } from "framer-motion";
import { IoCloseSharp } from "react-icons/io5";
import ConvBtn from "../Layout/ConvBtn";

type ConversationListProps = {
  conversations: Conversation[];
  currentConvId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  isBelow768: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function ConversationList({
  conversations,
  currentConvId,
  onSelectConversation,
  onNewChat,
  isBelow768,
  isOpen,
  setIsOpen,
}: ConversationListProps) {
  /**
   * 控制對話列表按鈕
   * 選到重複聊天室不換
   */
  const handleClickConversation = (id: number) => {
    console.log(currentConvId, id);
    if (currentConvId === id) return;
    onSelectConversation(id);
  };

  return (
    <>
      {isOpen && (
        <motion.aside
          initial={{ clipPath: "inset(0% 100% 0% 0%)" }} // inset(T R B L)
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 100% 0% 0%)" }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
          className={`min-w-60 max-w-72 border-r bg-white flex flex-col 
            ${isBelow768 && "absolute left-0 bg-white z-50 h-full"}
          `}
        >
          {/* start header */}
          <div className="p-4 flex items-center justify-between border-b min-h-16">
            <h2 className="text-lg sm:text-2xl md:text-base font-semibold">
              對話列表
            </h2>
            <div className="flex gap-2">
              <button
                onClick={onNewChat}
                className="text-sm sm:text-base md:text-sm px-2 py-1 font-medium text-blue-600 md:text-slate-400 border rounded-lg hover:text-blue-600 transition-colors duration-150"
              >
                + 新對話
              </button>
              {isBelow768 && isOpen && (
                <button
                  className="text-2xl sm:text-3xl"
                  onClick={() => setIsOpen(false)}
                >
                  <IoCloseSharp />
                </button>
              )}
            </div>
          </div>
          {/* end header */}

          {/* start conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <ConvBtn
                key={c.id}
                conv={c}
                currentConvId={currentConvId}
                handleClick={handleClickConversation}
                onNewChat={onNewChat}
              />
            ))}
            {/* end conversations */}

            {/* start alert */}
            {conversations.length === 0 && (
              <div className="px-4 py-6 text-xs text-slate-400">
                尚無對話紀錄。
              </div>
            )}
            {/* end alert */}
          </div>
        </motion.aside>
      )}
    </>
  );
}

export default ConversationList;
