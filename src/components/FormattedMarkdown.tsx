import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Pre-processes markdown text to ensure LaTeX math environments and delimiters 
 * render cleanly with KaTeX and Markdown tables format nicely with GFM.
 */
function processMathAndMarkdown(raw: string): string {
  if (!raw) return '';
  let processed = raw;

  // 1. Convert display math \[ ... \] to $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // 2. Convert inline math \( ... \) to $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 3. Ensure LaTeX environments like \begin{matrix} ... \end{matrix} or \begin{align} are wrapped in $$
  processed = processed.replace(
    /(^|[^\$])(\\begin\{(?:align|equation|matrix|bmatrix|pmatrix|cases|gather)\}[\s\S]*?\\end\{(?:align|equation|matrix|bmatrix|pmatrix|cases|gather)\})([^\$]|$)/g,
    '$1\n$$\n$2\n$$\n$3'
  );

  return processed;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const processedContent = processMathAndMarkdown(content);

  return (
    <div className={`markdown-body text-zinc-200 leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table: ({ node, ...props }) => (
            <div className="my-4 w-full overflow-x-auto rounded-lg border border-zinc-800/90 bg-zinc-950/80 p-1 shadow-md">
              <table {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr {...props} />
          ),
          th: ({ node, ...props }) => (
            <th {...props} />
          ),
          td: ({ node, ...props }) => (
            <td {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-xl font-bold text-emerald-400 mt-6 mb-3 border-b border-zinc-800 pb-2 tracking-tight flex items-center gap-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg font-bold text-emerald-300/90 mt-5 mb-2 border-b border-zinc-800/60 pb-1 tracking-tight" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base font-semibold text-zinc-100 mt-4 mb-2 tracking-tight" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm font-semibold text-zinc-200 mt-3 mb-1 font-mono uppercase tracking-wider" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-3 leading-relaxed text-zinc-300 text-sm" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-zinc-300 text-sm" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-zinc-300 text-sm" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-3 border-emerald-500/80 pl-3.5 italic my-3 text-zinc-300 bg-emerald-500/[0.03] py-2 rounded-r text-sm border-zinc-800" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-300 border border-zinc-800" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-200 shadow-inner">
                <code {...props}>{children}</code>
              </div>
            );
          },
          hr: ({ node, ...props }) => (
            <hr className="my-5 border-zinc-800" {...props} />
          )
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
};

