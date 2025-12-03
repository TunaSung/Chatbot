import { useState, type ReactNode, Children, isValidElement } from "react";

type CodeBlockProps = {
  className?: string;
  children: ReactNode;
};

/**
 * children 拿回來是 React Element，不是純字串
 * 所以要把它變成純文字
 */
function extractText(node: ReactNode): string {
  return Children.toArray(node) // 讓傳進來的 node 轉成 array
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child); // 把所有東西都轉成 String
      }
      if (isValidElement(child)) {
        // 這裡再往下挖 child.props.children（highlight.js 會把字包在 <span> 裡）
        return extractText((child.props as { children?: ReactNode })?.children);
      }
      return "";
    })
    .join("");
}

function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const langMatch = /language-(\w+)/.exec(className || "");
  const langLabel = langMatch?.[1] ?? "code";

  const handleCopy = async () => {
    const raw = extractText(children); // 把整個 code block 的純文字拿出來
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("copy failed", err);
    }
  };

  return (
    <div className="my-3 rounded-lg bg-slate-900 text-slate-100 border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 text-[0.7rem] bg-slate-900/80">
        <span className="uppercase tracking-wide text-slate-400">
          {langLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded border border-slate-600 px-2 py-0.5 text-[0.7rem] text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition"
        >
          {copied ? "已複製" : "複製"}
        </button>
      </div>
      <pre className="p-3 text-xs overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
