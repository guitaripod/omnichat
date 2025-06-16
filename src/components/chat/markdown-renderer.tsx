'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
// Dynamic import to avoid Edge runtime issues
let html2canvas: typeof import('html2canvas').default | null = null;
if (typeof window !== 'undefined') {
  import('html2canvas').then((module) => {
    html2canvas = module.default;
  });
}
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { ProgressiveImage } from './progressive-image';

interface MarkdownRendererProps {
  content: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

function CodeBlock({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
      card.style.backgroundColor = '#0d1117';
      card.style.padding = '32px';
      card.style.borderRadius = '12px';
      card.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';

      // Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '16px';
      header.style.paddingBottom = '16px';
      header.style.borderBottom = '1px solid #30363d';

      const langLabel = document.createElement('div');
      langLabel.textContent = language || 'code';
      langLabel.style.color = '#58a6ff';
      langLabel.style.fontSize = '14px';
      langLabel.style.fontWeight = '600';

      const dateLabel = document.createElement('div');
      dateLabel.textContent = new Date().toLocaleDateString();
      dateLabel.style.color = '#8b949e';
      dateLabel.style.fontSize = '12px';

      header.appendChild(langLabel);
      header.appendChild(dateLabel);

      // Clone the code block
      const codeBlock = document.querySelector(`[data-code-id="${codeId}"]`);
      if (codeBlock) {
        const clonedCode = codeBlock.cloneNode(true) as HTMLElement;
        clonedCode.style.margin = '0';
        clonedCode.style.background = 'transparent';
        clonedCode.style.padding = '0';
        card.appendChild(header);
        card.appendChild(clonedCode);
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
        card.appendChild(header);
        card.appendChild(pre);
      }

      container.appendChild(card);
      document.body.appendChild(container);

      // Generate image
      if (!html2canvas) {
        throw new Error('html2canvas not loaded');
      }
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
    }
  };

  return (
    <div className="group relative my-4">
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
          title="Export as image"
          disabled={isExporting}
        >
          <Download className="h-3 w-3" />
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
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
          img({ src, alt }) {
            // Handle Blob URLs or string URLs
            const srcString = typeof src === 'string' ? src : '';

            // Handle temporary image references
            if (srcString.startsWith('temp-image:')) {
              const imageId = srcString.replace('temp-image:', '');
              const actualSrc = `/api/temp-images/${imageId}`;
              console.log('[MarkdownRenderer] Converting temp-image to URL:', actualSrc);

              return (
                <div className="my-4">
                  <img
                    src={actualSrc}
                    alt={alt || 'Generated image'}
                    className="max-w-full rounded-lg shadow-lg"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                    onLoad={(e) => {
                      console.log(
                        '[MarkdownRenderer] Temp image loaded successfully',
                        e.currentTarget.naturalWidth,
                        'x',
                        e.currentTarget.naturalHeight
                      );
                    }}
                    onError={(e) => {
                      console.error('[MarkdownRenderer] Temp image failed to load', e);
                    }}
                  />
                </div>
              );
            }

            // Debug logging for base64 images
            if (srcString.startsWith('data:image')) {
              console.log('[MarkdownRenderer] Rendering base64 image, length:', srcString.length);
              console.log('[MarkdownRenderer] Base64 preview:', srcString.substring(0, 100));
              // Check if the base64 string appears complete
              const base64Part = srcString.split(',')[1];
              if (base64Part) {
                console.log('[MarkdownRenderer] Base64 data length:', base64Part.length);
                console.log('[MarkdownRenderer] Last 50 chars:', base64Part.slice(-50));
              }
            }

            // Check if this is a generated image
            const isGeneratedImage =
              alt?.toLowerCase().includes('generated') ||
              (typeof src === 'string' &&
                (src.includes('dalle') || src.includes('openai') || src.startsWith('data:image')));

            if (isGeneratedImage) {
              // For base64 images, use a simple img tag for now to debug
              if (srcString.startsWith('data:image')) {
                return (
                  <div className="my-4">
                    <img
                      src={srcString}
                      alt={alt || 'Generated image'}
                      className="max-w-full rounded-lg shadow-lg"
                      style={{ display: 'block', width: '100%', height: 'auto' }}
                      onLoad={(e) => {
                        console.log(
                          '[MarkdownRenderer] Base64 image loaded successfully',
                          e.currentTarget.naturalWidth,
                          'x',
                          e.currentTarget.naturalHeight
                        );
                      }}
                      onError={(e) => {
                        console.error('[MarkdownRenderer] Base64 image failed to load', e);
                      }}
                    />
                  </div>
                );
              }

              return (
                <ProgressiveImage
                  src={srcString}
                  alt={alt || 'Generated image'}
                  className="my-4 max-w-full shadow-lg"
                  skipLoadingState={true}
                />
              );
            }

            // Regular image (including generated images)
            return (
              <img
                src={src}
                alt={alt || 'Image'}
                className="my-4 rounded-lg shadow-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
                loading="lazy"
              />
            );
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
