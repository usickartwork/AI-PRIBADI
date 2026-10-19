'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-[#232327] bg-[#111113] text-[#E5E5E8] shadow-xs">
      <div className="flex items-center justify-between border-b border-[#232327] bg-[#161619] px-3.5 py-1.5 text-[11px] text-[#8E8E93]">
        <span className="uppercase font-medium tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code block"
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Disalin</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3.5 text-[12px] leading-relaxed">
        <pre className="m-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className="markdown-content text-[13.5px] leading-relaxed text-[#111113] space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, errorColor: 'currentColor' }]]}
        components={{
          // Headings (Unified clean sans-serif)
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-[#111113] mt-3 mb-1 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14.5px] font-bold text-[#111113] mt-2.5 mb-1 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-[#111113] mt-2 mb-0.5 first:mt-0">
              {children}
            </h3>
          ),

          // Paragraphs (Unified clean sans-serif)
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-[#111113]">
              {children}
            </p>
          ),

          // Lists (Unified clean sans-serif)
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 pl-1 text-[#111113] marker:text-[#111113]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 pl-1 text-[#111113] marker:text-[#111113] marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">{children}</li>
          ),

          // Blockquote (for Scripture or key reflections)
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 rounded-r-xl border-l-2 border-[#111113] bg-[#E5E5E8]/60 px-3.5 py-2 text-[#222225] italic">
              {children}
            </blockquote>
          ),

          // Pre pass-through
          pre: ({ children }) => <>{children}</>,

          // Code
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const rawText = String(children).replace(/\n$/, '');

            if (match) {
              return <CodeBlock language={match[1]} value={rawText} />;
            }

            if (rawText.includes('\n')) {
              return <CodeBlock language="text" value={rawText} />;
            }

            return (
              <code
                className="rounded-md bg-[#DFDFE3] px-1.5 py-0.5 text-[12px] font-medium text-[#111113]"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="my-2.5 w-full overflow-x-auto rounded-xl border border-[#DCDCE0]">
              <table className="w-full text-left text-xs divide-y divide-[#DCDCE0]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#EAEAEB] text-[#111113] font-semibold uppercase text-[10px] tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#EAEAEB] bg-white text-[#111113]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-[#111113]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[#111113] whitespace-nowrap sm:whitespace-normal">
              {children}
            </td>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111113] font-semibold underline underline-offset-3 hover:opacity-75 transition"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-[#DCDCE0]" />,

          // Emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-black">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Streaming cursor indicator */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-[#111113] animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
