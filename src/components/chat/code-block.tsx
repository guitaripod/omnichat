'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getHighlighter, normalizeLanguage } from '@/lib/shiki';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = '', className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Normalize language name
  const normalizedLanguage = normalizeLanguage(language);

  useEffect(() => {
    let isMounted = true;

    async function highlightCode() {
      if (!code) return;

      try {
        const highlighter = await getHighlighter();
        if (!isMounted) return;

        const html = highlighter.codeToHtml(code, {
          lang: normalizedLanguage,
          theme: 'github-dark',
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error('Shiki highlighting error:', error);
      }
    }

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [code, normalizedLanguage]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAsImage = async () => {
    setIsExporting(true);
    try {
      // Create a temporary container for the code block
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.background = '#0d1117';
      tempContainer.style.padding = '48px';
      tempContainer.style.borderRadius = '12px';
      tempContainer.style.minWidth = '600px';

      // Add header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '16px';
      header.style.alignItems = 'center';

      const languageLabel = document.createElement('div');
      languageLabel.textContent = normalizedLanguage || 'code';
      languageLabel.style.color = '#8b949e';
      languageLabel.style.fontSize = '14px';
      languageLabel.style.fontFamily = 'monospace';

      const watermark = document.createElement('div');
      watermark.textContent = 'OmniChat';
      watermark.style.color = '#8b949e';
      watermark.style.fontSize = '12px';
      watermark.style.opacity = '0.5';

      header.appendChild(languageLabel);
      header.appendChild(watermark);

      // Add code content
      const codeContainer = document.createElement('div');
      codeContainer.innerHTML = highlightedCode;
      codeContainer.querySelector('pre')!.style.margin = '0';
      codeContainer.querySelector('pre')!.style.padding = '24px';
      codeContainer.querySelector('pre')!.style.background = '#161b22';
      codeContainer.querySelector('pre')!.style.borderRadius = '8px';

      tempContainer.appendChild(header);
      tempContainer.appendChild(codeContainer);
      document.body.appendChild(tempContainer);

      // Generate image
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#0d1117',
        scale: 2,
      });

      // Clean up
      document.body.removeChild(tempContainer);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `code-${normalizedLanguage}-${Date.now()}.png`;
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
    <div className={`group relative my-4 ${className}`}>
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleExportAsImage}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-50"
          title="Export as image"
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
      {normalizedLanguage && (
        <div className="absolute top-2 left-4 z-10 text-xs text-gray-400">{normalizedLanguage}</div>
      )}
      {highlightedCode ? (
        <div
          className="shiki-code-block overflow-x-auto rounded-lg [&>pre]:m-0 [&>pre]:!bg-gray-900 [&>pre]:p-4 [&>pre]:pt-8"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 pt-8 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
