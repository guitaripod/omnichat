import { useState, useEffect, useCallback } from 'react';
import { OllamaClientProvider } from '@/services/ai/providers/ollama-client';

interface UseOllamaResult {
  isOllamaAvailable: boolean;
  isChecking: boolean;
  ollamaBaseUrl: string;
  checkOllamaConnection: () => Promise<boolean>;
  getOllamaModels: () => Promise<string[]>;
}

export function useOllama(customBaseUrl?: string): UseOllamaResult {
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(customBaseUrl || 'http://localhost:11434');

  // Update base URL when custom URL changes
  useEffect(() => {
    if (customBaseUrl) {
      setOllamaBaseUrl(customBaseUrl);
    }
  }, [customBaseUrl]);

  const checkOllamaConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const available = await OllamaClientProvider.isAvailable(ollamaBaseUrl);
      setIsOllamaAvailable(available);
      return available;
    } catch (error) {
      console.error('Error checking Ollama connection:', error);
      setIsOllamaAvailable(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [ollamaBaseUrl]);

  const getOllamaModels = useCallback(async (): Promise<string[]> => {
    if (!isOllamaAvailable) return [];

    try {
      const provider = new OllamaClientProvider(ollamaBaseUrl);
      return await provider.listModels();
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }, [isOllamaAvailable, ollamaBaseUrl]);

  // Check Ollama availability on mount and when URL changes
  useEffect(() => {
    checkOllamaConnection();
  }, [checkOllamaConnection]);

  // Periodically check Ollama availability (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkOllamaConnection();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkOllamaConnection]);

  return {
    isOllamaAvailable,
    isChecking,
    ollamaBaseUrl,
    checkOllamaConnection,
    getOllamaModels,
  };
}
