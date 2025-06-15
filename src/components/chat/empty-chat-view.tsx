'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  MessageSquare,
  Zap,
  Server,
  Globe,
  Bot,
  ArrowRight,
  Cpu,
  Cloud,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmptyChatViewProps {
  isPremium: boolean;
  onTemplateClick: () => void;
}

const suggestedPrompts = [
  {
    icon: Wand2,
    title: 'Creative Writing',
    prompt: 'Write a short story about a time traveler who...',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Bot,
    title: 'Code Assistant',
    prompt: 'Help me build a React component that...',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Globe,
    title: 'Research Helper',
    prompt: 'Explain the latest developments in...',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: 'Problem Solver',
    prompt: 'I need help figuring out how to...',
    color: 'from-orange-500 to-red-500',
  },
];

export function EmptyChatView({ isPremium, onTemplateClick }: EmptyChatViewProps) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:to-gray-400">
            Welcome to OmniChat
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Start a conversation with your favorite AI model
          </p>
        </motion.div>

        {/* Premium Templates */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 text-center"
          >
            <Button
              onClick={onTemplateClick}
              size="lg"
              className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 px-8 text-white shadow-lg hover:from-purple-700 hover:to-violet-700 hover:shadow-xl"
            >
              <Sparkles className="h-5 w-5" />
              Browse Templates
            </Button>
          </motion.div>
        )}

        {/* Suggested Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            Try one of these prompts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestedPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600"
                  onClick={() => {
                    const input = document.querySelector('textarea');
                    if (input) {
                      input.value = prompt.prompt;
                      input.focus();
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn('rounded-lg bg-gradient-to-br p-2 text-white', prompt.color)}
                    >
                      <prompt.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-medium text-gray-900 dark:text-white">
                        {prompt.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{prompt.prompt}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Start Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {/* Cloud AI Card */}
          <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-600 p-2 text-white">
                  <Cloud className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Cloud AI Models</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Access powerful models like GPT-4, Claude, and Gemini
              </p>
              <div className="flex items-center justify-between">
                <a
                  href="/profile?tab=api-keys"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Add API Keys
                  <ArrowRight className="h-4 w-4" />
                </a>
                <MessageSquare className="h-8 w-8 text-blue-600/20" />
              </div>
            </div>
          </Card>

          {/* Local AI Card */}
          <Card className="overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-purple-600 p-2 text-white">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Local AI Models</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Run AI models privately on your own computer
              </p>
              <div className="flex items-center justify-between">
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Install Ollama
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Server className="h-8 w-8 text-purple-600/20" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
