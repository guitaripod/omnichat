'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, Calendar, Sparkles, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ImageHistoryItemProps {
  imageUrl: string;
  prompt: string;
  model: string;
  createdAt: Date;
  metadata?: {
    originalSize?: string;
    compressedSize?: string;
    compressionRatio?: string;
  };
  onView?: () => void;
}

export default function ImageHistoryItem({
  imageUrl,
  prompt,
  model,
  createdAt,
  metadata,
  onView,
}: ImageHistoryItemProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${format(createdAt, 'yyyy-MM-dd-HHmmss')}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  const formatModel = (modelName: string) => {
    const modelMap: Record<string, string> = {
      'dall-e-3': 'DALL-E 3',
      'dall-e-2': 'DALL-E 2',
      'gpt-image-1': 'GPT Image 1',
    };
    return modelMap[modelName] || modelName;
  };

  return (
    <div className="group bg-background border-border hover:border-primary/50 relative overflow-hidden rounded-lg border transition-all duration-200">
      {/* Image Container */}
      <div
        className="bg-muted relative aspect-square cursor-pointer overflow-hidden"
        onClick={onView}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}

        {error ? (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
            <div className="p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">Failed to load image</p>
            </div>
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={prompt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
          />
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20"
            title="Download image"
          >
            <Download className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(imageUrl, '_blank');
            }}
            className="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20"
            title="Open in new tab"
          >
            <ExternalLink className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 p-3">
        {/* Model and Date */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary font-medium">{formatModel(model)}</span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(createdAt, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Prompt */}
        <div className="relative">
          <p className="text-foreground/80 line-clamp-2 pr-8 text-sm">{prompt}</p>
          <button
            onClick={handleCopyPrompt}
            className="text-muted-foreground hover:text-foreground absolute top-0 right-0 p-1 transition-colors"
            title="Copy prompt"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>

        {/* Size info if available */}
        {metadata?.compressionRatio && metadata.compressionRatio !== '0' && (
          <div className="text-muted-foreground text-xs">
            Compressed by {metadata.compressionRatio}%
          </div>
        )}
      </div>
    </div>
  );
}
