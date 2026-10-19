"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";

type MarkdownMessageProps = {
  content: string;
  isDark?: boolean;
};

function LatexBlock({ codeString, isDark }: { codeString: string; isDark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const cleanLatex = codeString
    .trim()
    .replace(/^(\$\$|\\\[)/, "")
    .replace(/(\$\$|\\\])$/, "")
    .trim();

  let renderedHtml = "";
  let hasError = false;
  try {
    renderedHtml = katex.renderToString(cleanLatex, {
      displayMode: true,
      throwOnError: false,
      strict: false,
    });
  } catch {
    hasError = true;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (hasError || !renderedHtml) {
    return <CodeBlock className="language-latex">{codeString}</CodeBlock>;
  }

  return (
    <div className={`my-4 overflow-hidden rounded-xl border ${isDark ? "border-zinc-800 bg-[#121217]" : "border-zinc-200 bg-zinc-50"} shadow-sm`}>
      <div className={`flex items-center justify-between border-b px-4 py-2 ${isDark ? "border-zinc-800 bg-[#18181f] text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}>
        <span className="text-[11px] font-medium tracking-wide uppercase">Formula LaTeX</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSource(!showSource)}
            className="text-[11px] font-medium hover:underline cursor-pointer"
          >
            {showSource ? "Sembunyikan Kode" : "Lihat Kode"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
              isDark ? "text-zinc-300 hover:bg-white/[0.1] hover:text-white" : "text-zinc-700 hover:bg-black/[0.05]"
            }`}
          >
            {copied ? (
              <span className="text-emerald-400 font-semibold">Tersalin</span>
            ) : (
              <span>Salin LaTeX</span>
            )}
          </button>
        </div>
      </div>
      <div
        className="overflow-x-auto p-4 max-w-full text-center"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      {showSource && (
        <div className={`border-t p-3 font-mono text-xs overflow-x-auto ${isDark ? "border-zinc-800 bg-black/40 text-zinc-300" : "border-zinc-200 bg-zinc-100 text-zinc-800"}`}>
          <code>{codeString}</code>
        </div>
      )}
    </div>
  );
}

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
    <div className="relative my-4 overflow-hidden rounded-xl border border-zinc-800 bg-[#121217] font-mono text-xs shadow-md">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181f] px-4 py-2 text-zinc-400">
        <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.1] hover:text-white"
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

// Helper to convert any literal <br> or &lt;br&gt; strings in rendered elements to real <br /> JSX
function renderWithBreaks(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    if (!/<br\s*\/?>/i.test(node) && !/&lt;br\s*\/?&gt;/i.test(node)) {
      return node;
    }
    const parts = node.split(/((?:&lt;|<)\s*br\s*\/?\s*(?:&gt;|>))/gi);
    return parts.map((part, i) => {
      if (/^(?:&lt;|<)\s*br\s*\/?\s*(?:&gt;|>)$/i.test(part)) {
        return <br key={i} />;
      }
      return part;
    });
  }
  if (Array.isArray(node)) {
    const hasBreaks = node.some(
      (child) => typeof child === "string" && (/<br\s*\/?>/i.test(child) || /&lt;br\s*\/?&gt;/i.test(child))
    );
    if (!hasBreaks) return node;
    return node.map((child, i) => (
      <span key={i}>{renderWithBreaks(child)}</span>
    ));
  }
  if (node && typeof node === "object" && "props" in node && (node as any).props?.children) {
    return {
      ...(node as any),
      props: {
        ...(node as any).props,
        children: renderWithBreaks((node as any).props.children),
      },
    };
  }
  return node;
}

// Safely normalize LaTeX \[ ... \] and \( ... \) outside code blocks
function normalizeLatexDelimiters(text: string): string {
  if (!text) return "";
  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]*`)/g;
  const parts = text.split(codeBlockRegex);

  return parts
    .map((part, index) => {
      // Keep code blocks untouched
      if (index % 2 === 1) {
        return part;
      }
      // Replace \[ ... \] with $$ ... $$ on separate lines
      let replaced = part.replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);
      // Replace \( ... \) with $ ... $
      replaced = replaced.replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => `$${math.trim()}$`);
      // Ensure existing block $$ ... $$ that might be missing surrounding newlines are properly block-spaced
      replaced = replaced.replace(/(^|[^\$])\$\$([^\$]+?)\$\$([^\$]|$)/g, (_match, before, math, after) => {
        return `${before}\n\n$$\n${math.trim()}\n$$\n\n${after}`;
      });
      return replaced;
    })
    .join("");
}

// Pre-sanitize raw markdown to convert <br> tags outside tables to Markdown hard breaks
function sanitizeMarkdown(text: string): string {
  if (!text) return "";
  const normalized = normalizeLatexDelimiters(text);
  const lines = normalized.split("\n");
  const processed = lines.map((line) => {
    // Keep table rows intact so pipe formatting isn't corrupted; renderWithBreaks handles td/th
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      return line;
    }
    return line.replace(/(&lt;|<)\s*br\s*\/?\s*(&gt;|>)/gi, "  \n");
  });
  return processed.join("\n");
}

export function MarkdownMessage({ content, isDark = false }: MarkdownMessageProps) {
  const textClr = isDark ? "text-zinc-200" : "text-zinc-900";
  const headingClr = isDark ? "text-white" : "text-black";
  const subHeadingClr = isDark ? "text-zinc-100" : "text-zinc-900";
  const borderClr = isDark ? "border-zinc-800" : "border-zinc-200";
  const codeInlineClr = isDark
    ? "bg-zinc-800/80 text-zinc-100 border-zinc-700/60"
    : "bg-zinc-200/70 text-zinc-900 border-zinc-300";

  const inlineTextColor = isDark ? "#f4f4f5" : "#09090b";
  const inlineHeadingColor = isDark ? "#ffffff" : "#000000";

  const processedContent = sanitizeMarkdown(content);

  return (
    <div className={`prose max-w-none text-[14.5px] leading-relaxed ${textClr}`} style={{ color: inlineTextColor }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[0.88em] font-semibold border ${codeInlineClr}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1].toLowerCase() : "";
            if (lang === "latex" || lang === "math" || lang === "katex") {
              return <LatexBlock codeString={String(children).replace(/\n$/, "")} isDark={isDark} />;
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          h1: ({ children }) => (
            <h1 className={`mb-3 mt-5 text-lg font-bold tracking-tight first:mt-0 ${headingClr}`} style={{ color: inlineHeadingColor }}>{renderWithBreaks(children)}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={`mb-2.5 mt-4 text-base font-bold tracking-tight first:mt-0 ${subHeadingClr}`} style={{ color: inlineHeadingColor }}>{renderWithBreaks(children)}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`mb-2 mt-3.5 text-sm font-semibold tracking-tight ${subHeadingClr}`} style={{ color: inlineHeadingColor }}>{renderWithBreaks(children)}</h3>
          ),
          p: ({ children }) => <p className={`mb-3 last:mb-0 leading-relaxed ${textClr}`} style={{ color: inlineTextColor }}>{renderWithBreaks(children)}</p>,
          ul: ({ children }) => <ul className={`mb-3 list-disc pl-5 space-y-1.5 ${textClr}`} style={{ color: inlineTextColor }}>{children}</ul>,
          ol: ({ children }) => <ol className={`mb-3 list-decimal pl-5 space-y-1.5 ${textClr}`} style={{ color: inlineTextColor }}>{children}</ol>,
          li: ({ children }) => <li className={`leading-relaxed ${textClr}`} style={{ color: inlineTextColor }}>{renderWithBreaks(children)}</li>,
          blockquote: ({ children }) => (
            <blockquote className={`my-3 border-l-2 py-1.5 pl-3.5 pr-2 italic rounded-r-lg ${
              isDark
                ? "border-zinc-500 bg-zinc-800/60 text-zinc-300"
                : "border-zinc-400 bg-zinc-100 text-zinc-900"
            }`}>
              {renderWithBreaks(children)}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className={`my-3 overflow-x-auto rounded-xl border shadow-sm ${borderClr}`}>
              <table className={`w-full text-left text-xs ${textClr}`}>{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={`font-bold ${isDark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-100 text-black"}`}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className={`px-3.5 py-2.5 font-bold border-b ${borderClr} ${headingClr}`} style={{ color: inlineHeadingColor }}>
              {renderWithBreaks(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className={`px-3.5 py-2.5 border-b ${borderClr} ${textClr}`} style={{ color: inlineTextColor }}>
              {renderWithBreaks(children)}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 transition hover:opacity-75 font-semibold ${headingClr}`}
            >
              {renderWithBreaks(children)}
            </a>
          ),
          hr: () => <hr className={`my-4 ${borderClr}`} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

