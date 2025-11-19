import { useRef, useEffect, type KeyboardEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 換行後 textarea 增高
   */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // 限制最大高度，避免整個畫面被填滿
    const maxHeight = 160; // 大約 4~5 行
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [value]);

  /**
   * Enter：送出
   * Shift+Enter：換行
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (disabled) return;
      onSend();
    }
  };

  return (
    <div className="mb-5 px-3 flex flex-col">
      {/* start textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="輸入訊息..."
        className="rounded-t-lg px-3 pt-2 text-sm sm:text-base md:text-sm max-h-40 resize-none leading-relaxed bg-slate-200 focus:outline-none"
      />
      {/* end textarea */}

      {/**
       * start send btn & others
       * 之後可以加點功能，先用點空白地方可以 focus
       */}
      <div className="grid grid-cols-[1fr_auto] w-full rounded-b-lg p-2 bg-slate-200">
        <div
          className="text-sm hover:cursor-text"
          onClick={() => textareaRef.current?.focus()}
        />
        <button
          disabled={disabled}
          onClick={onSend}
          className="px-3 py-1 rounded-lg flex bg-blue-600 text-white text-sm disabled:opacity-60"
        >
          送出
        </button>
      </div>
      {/* end send btn & others */}
    </div>
  );
}

export default ChatInput;
