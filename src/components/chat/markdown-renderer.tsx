'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Palette } from 'lucide-react';
import { useState } from 'react';
import html2canvas from 'html2canvas';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

const themes = [
  { name: 'GitHub Dark', bg: '#0d1117', headerBg: '#161b22', text: '#c9d1d9', accent: '#58a6ff' },
  { name: 'Dracula', bg: '#282a36', headerBg: '#44475a', text: '#f8f8f2', accent: '#bd93f9' },
  { name: 'Monokai', bg: '#272822', headerBg: '#3e3d32', text: '#f8f8f2', accent: '#a6e22e' },
  { name: 'Nord', bg: '#2e3440', headerBg: '#3b4252', text: '#d8dee9', accent: '#88c0d0' },
  { name: 'Solarized', bg: '#002b36', headerBg: '#073642', text: '#839496', accent: '#b58900' },
];

function CodeBlock({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  // Generate a unique ID for this code block
  const codeId = `code-${Math.random().toString(36).substring(7)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      // Main card
      const card = document.createElement('div');
      card.style.backgroundColor = selectedTheme.bg;
      card.style.padding = '48px';
      card.style.borderRadius = '16px';
      card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)';

      // Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '24px';
      header.style.padding = '16px 24px';
      header.style.backgroundColor = selectedTheme.headerBg;
      header.style.borderRadius = '12px';

      const langLabel = document.createElement('div');
      langLabel.textContent = language || 'code';
      langLabel.style.color = selectedTheme.accent;
      langLabel.style.fontSize = '18px';
      langLabel.style.fontWeight = '600';
      langLabel.style.textTransform = 'uppercase';
      langLabel.style.letterSpacing = '0.05em';

      const branding = document.createElement('div');
      branding.style.display = 'flex';
      branding.style.alignItems = 'center';
      branding.style.gap = '12px';
      branding.style.color = selectedTheme.text;
      branding.style.opacity = '0.7';

      const brandText = document.createElement('span');
      brandText.textContent = 'OmniChat';
      brandText.style.fontSize = '16px';
      brandText.style.fontWeight = '500';

      const brandSubtext = document.createElement('span');
      brandSubtext.textContent = new Date().toLocaleDateString();
      brandSubtext.style.fontSize = '14px';
      brandSubtext.style.opacity = '0.8';

      branding.appendChild(brandText);
      branding.appendChild(brandSubtext);

      header.appendChild(langLabel);
      header.appendChild(branding);

      // Code container
      const codeContainer = document.createElement('div');
      codeContainer.style.backgroundColor = '#0d1117';
      codeContainer.style.borderRadius = '12px';
      codeContainer.style.padding = '32px';
      codeContainer.style.overflow = 'hidden';

      // Clone the code block
      const codeBlock = document.querySelector(`[data-code-id="${codeId}"]`);
      if (codeBlock) {
        const clonedCode = codeBlock.cloneNode(true) as HTMLElement;
        clonedCode.style.margin = '0';
        clonedCode.style.background = 'transparent';
        codeContainer.appendChild(clonedCode);
      } else {
        // Fallback if we can't find the original
        const pre = document.createElement('pre');
        pre.style.margin = '0';
        pre.style.color = '#c9d1d9';
        pre.style.fontSize = '14px';
        pre.style.lineHeight = '1.6';
        pre.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
        const code = document.createElement('code');
        code.textContent = codeString;
        pre.appendChild(code);
        codeContainer.appendChild(pre);
      }

      card.appendChild(header);
      card.appendChild(codeContainer);
      container.appendChild(card);
      document.body.appendChild(container);

      // Generate image
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      // Clean up
      document.body.removeChild(container);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `code-${language}-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setShowThemes(false);
    }
  };

  return (
    <div className="group relative my-4">
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="relative">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center gap-1.5 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
            title="Export as image"
          >
            <Palette className="h-3 w-3" />
            Export
          </button>
          {showThemes && (
            <div className="ring-opacity-5 absolute top-8 right-0 mt-1 w-48 rounded-md bg-gray-800 shadow-lg ring-1 ring-black">
              <div className="py-1">
                {themes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => {
                      setSelectedTheme(theme);
                      handleExport();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    disabled={isExporting}
                  >
                    <div
                      className="mr-3 h-4 w-4 rounded"
                      style={{ backgroundColor: theme.accent }}
                    />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      {language && <div className="absolute top-2 left-4 text-xs text-gray-400">{language}</div>}
      <pre
        className="overflow-x-auto rounded-lg bg-gray-900 p-4 pt-8 text-sm"
        data-code-id={codeId}
      >
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-p:last:mb-0 prose-pre:my-2 prose-headings:mt-3 prose-headings:mb-2 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code({ inline, className, children, ...props }: CodeProps) {
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
            return (
              <CodeBlock className={className} {...props}>
                {children}
              </CodeBlock>
            );
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
