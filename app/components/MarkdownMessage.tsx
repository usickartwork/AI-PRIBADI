"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c10] font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-4 py-2 text-zinc-400">
        <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          title="Salin kode"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 font-semibold">Tersalin</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-zinc-100 leading-relaxed text-[13px]">
        <code>{children}</code>
      </div>
    </div>
  );
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-invert max-w-none text-[14.5px] leading-relaxed text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.88em] text-violet-300 font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-lg font-bold tracking-tight text-white first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2.5 mt-4 text-base font-bold tracking-tight text-zinc-100 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3.5 text-sm font-semibold tracking-tight text-zinc-200">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-zinc-200">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1.5 text-zinc-200">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1.5 text-zinc-200">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-violet-500/80 bg-violet-500/[0.04] py-1 pl-3.5 pr-2 italic text-zinc-300 rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs text-zinc-200">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.05] text-zinc-100">{children}</thead>,
          th: ({ children }) => <th className="px-3.5 py-2.5 font-semibold border-b border-white/[0.08]">{children}</th>,
          td: ({ children }) => <td className="px-3.5 py-2.5 border-b border-white/[0.04]">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 underline underline-offset-2 transition hover:text-violet-300 font-medium"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-white/[0.08]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
