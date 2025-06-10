import { useState, useEffect } from 'react';
import type { AIModel, AIProvider } from '@/services/ai/types';

interface UseModelsReturn {
  models: Record<AIProvider, AIModel[]>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<Record<AIProvider, AIModel[]>>({
    openai: [],
    anthropic: [],
    google: [],
    ollama: [],
    xai: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Force console log in production
  if (typeof window !== 'undefined') {
    (window as any).__OMNICHAT_DEBUG__ = true;
  }

  const fetchModels = async () => {
    console.log('[useModels] Starting model fetch...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useModels] Fetching from /api/models...');
      const response = await fetch('/api/models');

      if (!response.ok) {
        console.error('[useModels] API response not OK:', response.status);
        throw new Error('Failed to fetch models');
      }

      const data = (await response.json()) as { providers: Record<string, AIModel[]> };
      console.log('[useModels] Received data:', {
        providers: Object.keys(data.providers || {}),
        modelCounts: Object.entries(data.providers || {}).reduce(
          (acc, [key, models]) => {
            acc[key] = models.length;
            return acc;
          },
          {} as Record<string, number>
        ),
      });

      // Merge fetched models with empty defaults for missing providers
      const mergedModels: Record<AIProvider, AIModel[]> = {
        openai: data.providers.openai || [],
        anthropic: data.providers.anthropic || [],
        google: data.providers.google || [],
        ollama: data.providers.ollama || [],
        xai: data.providers.xai || [],
      };

      // Also try to fetch Ollama models if configured
      const savedKeys = localStorage.getItem('apiKeys');
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          if (parsed.ollama) {
            const ollamaResponse = await fetch(`${parsed.ollama}/api/tags`);
            if (ollamaResponse.ok) {
              const ollamaData = (await ollamaResponse.json()) as { models?: { name: string }[] };
              const ollamaModels: AIModel[] = (ollamaData.models || []).map(
                (m: { name: string }) => ({
                  id: `ollama/${m.name}`,
                  name: m.name,
                  provider: 'ollama' as AIProvider,
                  contextWindow: 4096,
                  maxOutput: 4096,
                  supportsVision: false,
                  supportsTools: false,
                  supportsWebSearch: false,
                  description: `Local Ollama model: ${m.name}`,
                })
              );
              mergedModels.ollama = ollamaModels;
            }
          }
        } catch (err) {
          console.log('Failed to fetch Ollama models:', err);
          // Continue without Ollama models
        }
      }

      setModels(mergedModels);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch models');

      // Fall back to static models from AI_MODELS if available
      try {
        const { AI_MODELS } = await import('@/services/ai/types');
        setModels(AI_MODELS);
      } catch {
        // If even static models fail, keep empty arrays
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add error logging
    console.error('[useModels] Hook initialized, starting fetch...');
    fetchModels().catch((err) => {
      console.error('[useModels] Failed to fetch models:', err);
    });
  }, []);

  return {
    models,
    isLoading,
    error,
    refetch: fetchModels,
  };
}
