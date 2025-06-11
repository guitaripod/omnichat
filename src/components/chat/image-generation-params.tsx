'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/utils';

interface ImageGenerationParamsProps {
  model: string;
  onParamsChange?: (params: ImageGenerationOptions) => void;
}

export interface ImageGenerationOptions {
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
  background?: string;
  outputFormat?: string;
  outputCompression?: number;
}

type ImageGenerationModel = 'gpt-image-1' | 'dall-e-3' | 'dall-e-2';

const modelDefaults: Record<ImageGenerationModel, ImageGenerationOptions> = {
  'gpt-image-1': {
    size: 'auto',
    quality: 'auto',
    n: 1,
    outputFormat: 'png',
    background: 'auto',
  },
  'dall-e-3': {
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    n: 1,
  },
  'dall-e-2': {
    size: '1024x1024',
    n: 1,
  },
};

const sizeOptions: Record<ImageGenerationModel, string[]> = {
  'gpt-image-1': ['auto', '1024x1024', '1536x1024', '1024x1536'],
  'dall-e-3': ['1024x1024', '1792x1024', '1024x1792'],
  'dall-e-2': ['256x256', '512x512', '1024x1024'],
};

const qualityOptions: Partial<Record<ImageGenerationModel, string[]>> = {
  'gpt-image-1': ['auto', 'high', 'medium', 'low'],
  'dall-e-3': ['standard', 'hd'],
};

export function ImageGenerationParams({ model, onParamsChange }: ImageGenerationParamsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [params, setParams] = useState<ImageGenerationOptions>(
    modelDefaults[model as ImageGenerationModel] || {}
  );

  // Reset params when model changes
  useEffect(() => {
    if (['gpt-image-1', 'dall-e-3', 'dall-e-2'].includes(model)) {
      const newDefaults = modelDefaults[model as ImageGenerationModel] || {};
      setParams(newDefaults);
      onParamsChange?.(newDefaults);
    }
  }, [model, onParamsChange]);

  const updateParam = (key: keyof ImageGenerationOptions, value: string | number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  if (!['gpt-image-1', 'dall-e-3', 'dall-e-2'].includes(model)) {
    return null;
  }

  const imageModel = model as ImageGenerationModel;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
          'border-gray-200 bg-white hover:bg-gray-50',
          'dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
          'transition-colors'
        )}
      >
        <Settings className="h-4 w-4" />
        Image Settings
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute right-0 bottom-full z-50 mb-2 w-80 rounded-lg border bg-white shadow-lg',
              'dark:border-gray-700 dark:bg-gray-800'
            )}
          >
            <div className="space-y-4 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Image Generation Settings
              </h3>

              {/* Size selector */}
              {sizeOptions[imageModel] && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Size
                  </label>
                  <select
                    value={params.size || sizeOptions[imageModel][0]}
                    onChange={(e) => updateParam('size', e.target.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm',
                      'border-gray-300 bg-white',
                      'dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    )}
                  >
                    {sizeOptions[imageModel].map((size: string) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quality selector */}
              {qualityOptions[imageModel] && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quality
                  </label>
                  <select
                    value={params.quality || qualityOptions[imageModel][0]}
                    onChange={(e) => updateParam('quality', e.target.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm',
                      'border-gray-300 bg-white',
                      'dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    )}
                  >
                    {qualityOptions[imageModel].map((quality: string) => (
                      <option key={quality} value={quality}>
                        {quality}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Style selector for DALL-E 3 */}
              {model === 'dall-e-3' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Style
                  </label>
                  <select
                    value={params.style || 'vivid'}
                    onChange={(e) => updateParam('style', e.target.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm',
                      'border-gray-300 bg-white',
                      'dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    )}
                  >
                    <option value="vivid">Vivid (hyper-real, dramatic)</option>
                    <option value="natural">Natural (realistic)</option>
                  </select>
                </div>
              )}

              {/* Background for GPT Image 1 */}
              {model === 'gpt-image-1' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Background
                  </label>
                  <select
                    value={params.background || 'auto'}
                    onChange={(e) => updateParam('background', e.target.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm',
                      'border-gray-300 bg-white',
                      'dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    )}
                  >
                    <option value="auto">Auto</option>
                    <option value="transparent">Transparent</option>
                    <option value="opaque">Opaque</option>
                  </select>
                </div>
              )}

              {/* Number of images */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of Images
                </label>
                <select
                  value={params.n || 1}
                  onChange={(e) => updateParam('n', parseInt(e.target.value))}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-sm',
                    'border-gray-300 bg-white',
                    'dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  )}
                  disabled={model === 'dall-e-3'} // DALL-E 3 only supports 1 image
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'image' : 'images'}
                    </option>
                  ))}
                </select>
                {model === 'dall-e-3' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    DALL-E 3 only supports generating 1 image at a time
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
