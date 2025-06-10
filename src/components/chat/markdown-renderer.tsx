'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './code-block';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-p:last:mb-0 prose-pre:my-2 prose-headings:mt-3 prose-headings:mb-2 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock code={codeString} language={language} />;
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="my-2 list-disc pl-6">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2 list-decimal pl-6">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-1">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-4 border-l-4 border-gray-300 pl-4 text-gray-700 italic dark:border-gray-600 dark:text-gray-300">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>;
          },
          tbody({ children }) {
            return (
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
            );
          },
          tr({ children }) {
            return <tr>{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{children}</td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
