'use client';

import { useState, useEffect } from 'react';
import { AIProviderFactory } from '@/services/ai/provider-factory';
import { OllamaProvider } from '@/services/ai/providers/ollama';

export default function ApiSettings() {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    ollama: 'http://localhost:11434',
  });

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
  });

  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>(
    'checking'
  );
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  useEffect(() => {
    // Check Ollama connection
    checkOllamaConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys.ollama]);

  const checkOllamaConnection = async () => {
    setOllamaStatus('checking');
    try {
      const provider = new OllamaProvider(apiKeys.ollama);
      const isConnected = await provider.testConnection();

      if (isConnected) {
        setOllamaStatus('connected');
        const models = await provider.listModels();
        setOllamaModels(models);
      } else {
        setOllamaStatus('disconnected');
        setOllamaModels([]);
      }
    } catch {
      setOllamaStatus('disconnected');
      setOllamaModels([]);
    }
  };

  const handleSave = (provider: keyof typeof apiKeys) => {
    const updatedKeys = { ...apiKeys };
    localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));

    // Update the AI provider factory
    switch (provider) {
      case 'openai':
        AIProviderFactory.updateApiKey('openai', apiKeys.openai);
        break;
      case 'anthropic':
        AIProviderFactory.updateApiKey('anthropic', apiKeys.anthropic);
        break;
      case 'google':
        AIProviderFactory.updateApiKey('google', apiKeys.google);
        break;
      case 'ollama':
        AIProviderFactory.updateApiKey('ollama', apiKeys.ollama);
        break;
    }
  };

  const toggleShowKey = (provider: keyof typeof showKeys) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        API Configuration
      </h3>

      {/* OpenAI */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          OpenAI API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKeys.openai ? 'text' : 'password'}
            value={apiKeys.openai}
            onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
            placeholder="sk-..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => toggleShowKey('openai')}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {showKeys.openai ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => handleSave('openai')}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      {/* Anthropic */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Anthropic API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKeys.anthropic ? 'text' : 'password'}
            value={apiKeys.anthropic}
            onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
            placeholder="sk-ant-..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => toggleShowKey('anthropic')}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {showKeys.anthropic ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => handleSave('anthropic')}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      {/* Google */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Google API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKeys.google ? 'text' : 'password'}
            value={apiKeys.google}
            onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
            placeholder="AIza..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => toggleShowKey('google')}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {showKeys.google ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => handleSave('google')}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      {/* Ollama */}
      <div className="mb-4">
        <div className="mb-3">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ollama (Local AI Models)
          </label>
          <div className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="mb-2 font-medium">Quick Setup:</p>
            <ol className="ml-4 list-decimal space-y-1 text-xs">
              <li>
                Install Ollama:{' '}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                  curl -fsSL https://ollama.com/install.sh | sh
                </code>
              </li>
              <li>
                Enable CORS:{' '}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                  OLLAMA_ORIGINS="*" ollama serve
                </code>
              </li>
              <li>
                Pull a model:{' '}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                  ollama pull llama3.2
                </code>
              </li>
              <li>Configure the URL below (default: http://localhost:11434)</li>
            </ol>
            <p className="mt-2 text-xs">
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300"
              >
                Learn more about Ollama →
              </a>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={apiKeys.ollama}
            onChange={(e) => setApiKeys({ ...apiKeys, ollama: e.target.value })}
            placeholder="http://localhost:11434"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => handleSave('ollama')}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>

        {/* Connection Status */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              ollamaStatus === 'connected'
                ? 'bg-green-500'
                : ollamaStatus === 'checking'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {ollamaStatus === 'connected'
              ? 'Connected'
              : ollamaStatus === 'checking'
                ? 'Checking...'
                : 'Disconnected'}
          </span>
          {ollamaStatus === 'connected' && ollamaModels.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-500">
              ({ollamaModels.length} models available)
            </span>
          )}
        </div>

        {/* Troubleshooting */}
        {ollamaStatus === 'disconnected' && (
          <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">Connection failed. Check that:</p>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li>
                Ollama is running (<code>ollama serve</code>)
              </li>
              <li>CORS is enabled (see setup instructions above)</li>
              <li>The URL is correct (default: http://localhost:11434)</li>
            </ul>
          </div>
        )}

        {/* Available Models */}
        {ollamaStatus === 'connected' && ollamaModels.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Available Models:
            </p>
            <div className="flex flex-wrap gap-1">
              {ollamaModels.map((model) => (
                <span
                  key={model}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
