'use client';

import { useState, useEffect } from 'react';
import { AIProviderFactory } from '@/services/ai/provider-factory';
import { OllamaProvider } from '@/services/ai/providers/ollama';
import { useUserTier } from '@/hooks/use-user-tier';
import { UserTier } from '@/lib/tier';
import { useRouter } from 'next/navigation';
import { Key, CreditCard, Sparkles } from 'lucide-react';

export default function ApiSettings() {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    xai: '',
    deepseek: '',
    ollama: 'http://localhost:11434',
  });

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    xai: false,
    deepseek: false,
  });

  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>(
    'checking'
  );
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const { tier } = useUserTier();
  const router = useRouter();

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
      case 'xai':
        AIProviderFactory.updateApiKey('xai', apiKeys.xai);
        break;
      case 'deepseek':
        AIProviderFactory.updateApiKey('deepseek', apiKeys.deepseek);
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
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Configuration</h3>
        {tier === UserTier.FREE && (
          <button
            onClick={() => router.push('/pricing')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-pink-600"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Pro Benefits Banner */}
      {tier === UserTier.FREE && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Skip the API key hassle with Pro!
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Get instant access to all premium AI models without managing API keys. OmniChat
                handles everything for you.
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View Pro benefits →
              </button>
            </div>
          </div>
        </div>
      )}

      {tier === UserTier.PAID && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Pro subscriber - You can use all models without API keys!
            </p>
          </div>
          <p className="mt-1 text-xs text-green-700 dark:text-green-400">
            Add your own API keys below to use your own quotas instead of OmniChat credits.
          </p>
        </div>
      )}

      {/* OpenAI */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            OpenAI API Key
          </label>
          {tier === UserTier.FREE && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Key className="h-3 w-3" />
              Required for GPT models
            </span>
          )}
        </div>
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
        <p className="mt-2 text-xs text-gray-500">
          Get your key from{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            platform.openai.com
          </a>
        </p>
      </div>

      {/* Anthropic */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Anthropic API Key
          </label>
          {tier === UserTier.FREE && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Key className="h-3 w-3" />
              Required for Claude models
            </span>
          )}
        </div>
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
        <p className="mt-2 text-xs text-gray-500">
          Get your key from{' '}
          <a
            href="https://console.anthropic.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
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

      {/* xAI */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          xAI API Key (Grok)
        </label>
        <div className="flex gap-2">
          <input
            type={showKeys.xai ? 'text' : 'password'}
            value={apiKeys.xai}
            onChange={(e) => setApiKeys({ ...apiKeys, xai: e.target.value })}
            placeholder="xai-..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => toggleShowKey('xai')}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {showKeys.xai ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => handleSave('xai')}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      {/* DeepSeek */}
      <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          DeepSeek API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKeys.deepseek ? 'text' : 'password'}
            value={apiKeys.deepseek}
            onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
            placeholder="sk-..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => toggleShowKey('deepseek')}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {showKeys.deepseek ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => handleSave('deepseek')}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      {/* Ollama */}
      <div className="mb-4">
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ollama (Local AI Models)
            </label>
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <Sparkles className="h-3 w-3" />
              Always Free!
            </span>
          </div>
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
            <p className="mb-2 font-medium">🎉 Free unlimited AI with Ollama!</p>
            <p className="mb-3 text-xs">
              Run powerful AI models locally on your computer - no API keys or credits needed.
            </p>
            <p className="mb-2 font-medium">Quick Setup:</p>
            <ol className="ml-4 list-decimal space-y-1 text-xs">
              <li>
                Install Ollama:{' '}
                <code className="rounded bg-green-100 px-1 dark:bg-green-800">
                  curl -fsSL https://ollama.com/install.sh | sh
                </code>
              </li>
              <li>
                Enable CORS:{' '}
                <code className="rounded bg-green-100 px-1 dark:bg-green-800">
                  OLLAMA_ORIGINS="*" ollama serve
                </code>
              </li>
              <li>
                Pull a model:{' '}
                <code className="rounded bg-green-100 px-1 dark:bg-green-800">
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
