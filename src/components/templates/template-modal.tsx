'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Sparkles,
  Crown,
  Briefcase,
  Code,
  Palette,
  User,
  Zap,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  ConversationTemplate,
  CONVERSATION_TEMPLATES,
  TEMPLATE_COLORS,
} from '@/lib/conversation-templates';
import { useUserData } from '@/hooks/use-user-data';
import { useConversationStore } from '@/store/conversations';
import { PremiumBadge } from '@/components/premium-badge';
import { cn } from '@/lib/utils';
import { generateId } from '@/utils';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
}

const categoryIcons = {
  productivity: <Zap className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  technical: <Code className="h-4 w-4" />,
  personal: <User className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
};

export function TemplateModal({ open, onClose }: TemplateModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ConversationTemplate | null>(null);

  const { isPremium } = useUserData();
  const createConversation = useConversationStore((state) => state.createConversation);
  const addMessage = useConversationStore((state) => state.addMessage);

  // Filter templates based on search and category
  const filteredTemplates = CONVERSATION_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: ConversationTemplate) => {
    if (!isPremium && template.isPremium) {
      router.push('/pricing');
      return;
    }
    setSelectedTemplate(template);
  };

  const handleStartConversation = async () => {
    if (!selectedTemplate) return;

    // Create new conversation with template
    const conversation = await createConversation(
      `${selectedTemplate.icon} ${selectedTemplate.name}`,
      selectedTemplate.suggestedModel || 'gpt-4.1-mini'
    );

    // Add system message with the template prompt
    await addMessage(conversation.id, {
      id: generateId(),
      conversationId: conversation.id,
      role: 'system',
      content: selectedTemplate.systemPrompt,
      createdAt: new Date(),
    });

    // Navigate to the new conversation
    router.push(`/chat/${conversation.id}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 flex h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Conversation Templates
            {isPremium && <PremiumBadge size="xs" />}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <div className="flex h-full flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-gray-50 px-9 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                All
              </button>
              {Object.entries(categoryIcons).map(([category, icon]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  )}
                >
                  {icon}
                  <span className="capitalize">{category}</span>
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-3 md:grid-cols-2">
                {filteredTemplates.map((template) => {
                  const isLocked = !isPremium && template.isPremium;
                  const colors = TEMPLATE_COLORS[template.color];
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        'group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
                        isSelected
                          ? `${colors.border} ${colors.bg} ring-2 ring-offset-2`
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                        isLocked && 'opacity-75 hover:opacity-100'
                      )}
                    >
                      <div className="flex w-full items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <h3 className="flex items-center gap-2 font-medium">
                              {template.name}
                              {isLocked && (
                                <Badge variant="secondary" className="gap-1">
                                  <Crown className="h-3 w-3" />
                                  Pro
                                </Badge>
                              )}
                            </h3>
                            <p className="text-muted-foreground text-sm">{template.description}</p>
                          </div>
                        </div>
                        {isSelected && <ChevronRight className={cn('h-5 w-5', colors.text)} />}
                      </div>

                      {/* Suggested model */}
                      {template.suggestedModel && (
                        <Badge variant="outline" className="text-xs">
                          Optimized for {template.suggestedModel}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  No templates found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {selectedTemplate ? (
                <span>
                  Selected: <strong>{selectedTemplate.name}</strong>
                </span>
              ) : (
                <span>Select a template to get started</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStartConversation}
                disabled={!selectedTemplate}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Start Conversation
              </Button>
            </div>
          </div>

          {/* Free tier CTA */}
          {!isPremium && (
            <div className="mt-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 p-4 dark:from-purple-900/20 dark:to-violet-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-300">
                    Unlock All Templates
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Get access to 15+ premium templates with Pro
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/pricing')}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
