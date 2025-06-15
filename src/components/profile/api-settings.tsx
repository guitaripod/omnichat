'use client';

import { useState, useEffect } from 'react';
import { useUserTier } from '@/hooks/use-user-tier';
import { UserTier } from '@/lib/tier';
import { useRouter } from 'next/navigation';
import { Key, CreditCard, Sparkles, Check, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ApiKeyConfig {
  provider: string;
  name: string;
  placeholder: string;
  helpUrl: string;
  helpText: string;
  required?: boolean;
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    provider: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: 'platform.openai.com',
    required: true,
  },
  {
    provider: 'anthropic',
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/account/keys',
    helpText: 'console.anthropic.com',
    required: true,
  },
  {
    provider: 'google',
    name: 'Google',
    placeholder: 'AIza...',
    helpUrl: 'https://makersuite.google.com/app/apikey',
    helpText: 'makersuite.google.com',
  },
  {
    provider: 'xai',
    name: 'xAI (Grok)',
    placeholder: 'xai-...',
    helpUrl: 'https://console.x.ai/team',
    helpText: 'console.x.ai',
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    helpText: 'platform.deepseek.com',
  },
];

export default function ApiSettings() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>(
    'checking'
  );
  const { tier } = useUserTier();
  const router = useRouter();

  useEffect(() => {
    // Load saved API keys
    API_KEY_CONFIGS.forEach(({ provider }) => {
      const savedKey = localStorage.getItem(`${provider}_api_key`);
      if (savedKey) {
        setApiKeys((prev) => ({ ...prev, [provider]: savedKey }));
      }
    });

    // Load Ollama URL
    const savedOllamaUrl = localStorage.getItem('ollama_base_url');
    if (savedOllamaUrl) {
      setOllamaUrl(savedOllamaUrl);
    }

    // Check Ollama connection
    checkOllamaConnection(savedOllamaUrl || ollamaUrl);
  }, [ollamaUrl]);

  const checkOllamaConnection = async (url: string) => {
    try {
      const response = await fetch(`${url}/api/tags`);
      const isAvailable = response.ok;
      setOllamaStatus(isAvailable ? 'connected' : 'disconnected');
    } catch {
      setOllamaStatus('disconnected');
    }
  };

  const handleSave = (provider: string, value: string) => {
    if (value) {
      localStorage.setItem(`${provider}_api_key`, value);
      // Clear any cached providers
      window.location.reload();
    } else {
      localStorage.removeItem(`${provider}_api_key`);
    }
  };

  const handleOllamaSave = () => {
    localStorage.setItem('ollama_base_url', ollamaUrl);
    checkOllamaConnection(ollamaUrl);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Configuration</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add your own API keys to use AI models without OmniChat credits
          </p>
        </div>
        {tier === UserTier.FREE && (
          <Button onClick={() => router.push('/pricing')} className="gap-2" variant="default">
            <Sparkles className="h-4 w-4" />
            Upgrade Plan
          </Button>
        )}
      </div>

      {/* Pro Benefits Banner */}
      {tier === UserTier.FREE && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Use all models without API keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Access to all AI models</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>No API key management</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Save up to $50/month on API costs</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {API_KEY_CONFIGS.map(({ provider, name, placeholder, helpUrl, helpText, required }) => (
          <Card key={provider} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{name}</CardTitle>
                {required && tier === UserTier.FREE && (
                  <Badge variant="outline" className="text-xs">
                    <Key className="mr-1 h-3 w-3" />
                    Required
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`${provider}-key`} className="sr-only">
                  {name} API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`${provider}-key`}
                      type={showKeys[provider] ? 'text' : 'password'}
                      value={apiKeys[provider] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setApiKeys({ ...apiKeys, [provider]: e.target.value })
                      }
                      placeholder={placeholder}
                      className="pr-10"
                    />
                    <button
                      onClick={() => toggleShowKey(provider)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showKeys[provider] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button onClick={() => handleSave(provider, apiKeys[provider] || '')} size="sm">
                    Save
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Get your key from{' '}
                <a
                  href={helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {helpText}
                </a>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ollama Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Ollama (Local AI Models)
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <Sparkles className="mr-1 h-3 w-3" />
                Always Free!
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {ollamaStatus === 'connected' ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
          <CardDescription>
            Run powerful AI models locally on your computer - no API keys or credits needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white/80 p-4 dark:bg-gray-800/80">
            <h4 className="mb-2 font-medium">Quick Setup:</h4>
            <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>
                1. Install Ollama from{' '}
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  ollama.ai
                </a>
              </li>
              <li>
                2. Run:{' '}
                <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">
                  ollama pull llama3.2
                </code>
              </li>
              <li>3. Start Ollama and select a model below</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ollama-url">Ollama Server URL</Label>
            <div className="flex gap-2">
              <Input
                id="ollama-url"
                type="url"
                value={ollamaUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
              <Button onClick={handleOllamaSave} variant="outline">
                Test Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
