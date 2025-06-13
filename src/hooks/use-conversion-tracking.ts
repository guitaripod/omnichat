import { useEffect, useState } from 'react';
import { ConversionTriggerManager, ConversionTrigger } from '@/lib/conversion-triggers';
import { useUserData } from '@/hooks/use-user-data';
import { useConversationStore } from '@/store/conversations';

export function useConversionTracking() {
  const [activeTrigger, setActiveTrigger] = useState<ConversionTrigger | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { isPremium } = useUserData();
  const conversations = useConversationStore((state) => state.conversations);
  const messages = useConversationStore((state) => state.messages);

  // Track conversation count
  useEffect(() => {
    if (!isPremium && conversations) {
      const count = Object.keys(conversations).length;
      const stats = ConversionTriggerManager.getStats();
      if (count > stats.conversationCount) {
        ConversionTriggerManager.updateStats({ conversationCount: count });
      }
    }
  }, [conversations, isPremium]);

  // Track message count
  useEffect(() => {
    if (!isPremium && messages) {
      const totalMessages = Object.values(messages).reduce(
        (sum, convoMessages) => sum + convoMessages.length,
        0
      );
      const stats = ConversionTriggerManager.getStats();
      if (totalMessages > stats.messageCount) {
        ConversionTriggerManager.updateStats({ messageCount: totalMessages });
      }
    }
  }, [messages, isPremium]);

  // Check for active triggers
  useEffect(() => {
    if (isPremium) {
      setActiveTrigger(null);
      setIsVisible(false);
      return;
    }

    const checkTriggers = () => {
      const trigger = ConversionTriggerManager.getActiveTrigger();
      if (trigger && trigger.id !== activeTrigger?.id) {
        setActiveTrigger(trigger);
        setIsVisible(true);
        ConversionTriggerManager.markTriggerShown(trigger.id);
      }
    };

    // Check immediately
    checkTriggers();

    // Check periodically
    const interval = setInterval(checkTriggers, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isPremium, conversations, messages, activeTrigger?.id]);

  const dismiss = () => {
    setIsVisible(false);
  };

  const trackModelSelection = (modelId: string) => {
    if (!isPremium) {
      ConversionTriggerManager.trackModelSelection(modelId);
    }
  };

  return {
    activeTrigger,
    isVisible,
    dismiss,
    trackModelSelection,
  };
}
