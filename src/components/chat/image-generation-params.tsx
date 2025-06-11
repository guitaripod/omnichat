'use client';

import { useState, useEffect } from 'react';
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
    size: '1024x1024',
    quality: 'low',
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
  'gpt-image-1': ['1024x1024', '1536x1024', '1024x1536'],
  'dall-e-3': ['1024x1024', '1792x1024', '1024x1792'],
  'dall-e-2': ['256x256', '512x512', '1024x1024'],
};

const qualityOptions: Partial<Record<ImageGenerationModel, string[]>> = {
  'gpt-image-1': ['low', 'medium', 'high'],
  'dall-e-3': ['standard', 'hd'],
};

export function ImageGenerationParams({ model, onParamsChange }: ImageGenerationParamsProps) {
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
    <div className="flex flex-wrap items-center gap-3">
      {/* Size selector */}
      {sizeOptions[imageModel] && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
          <select
            value={params.size || sizeOptions[imageModel][0]}
            onChange={(e) => updateParam('size', e.target.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              'border-gray-300 bg-white',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-white',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
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
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality</label>
          <select
            value={params.quality || qualityOptions[imageModel][0]}
            onChange={(e) => updateParam('quality', e.target.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              'border-gray-300 bg-white',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-white',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
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
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Style</label>
          <select
            value={params.style || 'vivid'}
            onChange={(e) => updateParam('style', e.target.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              'border-gray-300 bg-white',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-white',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            )}
          >
            <option value="vivid">Vivid</option>
            <option value="natural">Natural</option>
          </select>
        </div>
      )}

      {/* Background for GPT Image 1 */}
      {model === 'gpt-image-1' && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Background</label>
          <select
            value={params.background || 'auto'}
            onChange={(e) => updateParam('background', e.target.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              'border-gray-300 bg-white',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-white',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            )}
          >
            <option value="auto">Auto</option>
            <option value="transparent">Transparent</option>
            <option value="opaque">Opaque</option>
          </select>
        </div>
      )}

      {/* Number of images */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
        <select
          value={params.n || 1}
          onChange={(e) => updateParam('n', parseInt(e.target.value))}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm',
            'border-gray-300 bg-white',
            'dark:border-gray-600 dark:bg-gray-700 dark:text-white',
            'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
          )}
          disabled={model === 'dall-e-3'} // DALL-E 3 only supports 1 image
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'image' : 'images'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
