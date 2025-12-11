import type { Message } from "../../../../types/chat.type";
import CodeBlock from "../Layout/CodeBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

type ChatMessageProps = {
  message: Message;
};

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[70%] gap-2">
        {/* 氣泡本體（支援 Markdown + code 高亮） */}
        <div
          className={`rounded-2xl px-4 py-2 text-sm sm:text-base md:text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-white border border-slate-200 rounded-bl-none text-slate-900"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-lg font-semibold mb-2 border-b border-slate-200 pb-1"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base font-semibold mt-2 mb-1" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="whitespace-pre-wrap" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc list-inside space-y-1 mb-2"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal list-inside space-y-1 mb-2"
                  {...props}
                />
              ),
              code: ({ className, children, ...props }: any) => {
                const text = String(children ?? "");

                const hasLanguage = (className ?? "").startsWith("language-");
                const hasLineBreak = text.includes("\n");
                const isLong = text.length > 40;

                // 推論：這一段是不是「區塊程式碼」
                const isBlock = hasLanguage || hasLineBreak || isLong;

                // 行內 `code`：小小灰底，不要變成整塊 chunk
                if (!isBlock) {
                  return (
                    <code
                      className="rounded bg-slate-900/5 px-1.5 py-0.5 text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                // 區塊程式碼：整塊深色區塊 + 高亮 + 複製按鈕
                return <CodeBlock className={className}>{children}</CodeBlock>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
