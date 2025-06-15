import type { User } from '@/lib/db/schema';
import { UPGRADE_MESSAGES } from '@/lib/subscription-plans';

export enum UserTier {
  FREE = 'free',
  PAID = 'paid',
}

export function getUserTier(user: User | null): UserTier {
  if (!user) return UserTier.FREE;

  // Check tier field first
  if (user.tier === UserTier.PAID) {
    return UserTier.PAID;
  }

  // Fallback to subscription status for backwards compatibility
  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
    return UserTier.PAID;
  }

  return UserTier.FREE;
}

export function canUseCloudModels(user: User | null): boolean {
  return getUserTier(user) === UserTier.PAID;
}

export function canUseModel(
  model: { provider: string },
  user: User | null,
  userApiKeys: Record<string, string>
): boolean {
  // Local models are always free
  if (model.provider === 'ollama') {
    return true;
  }

  // User has their own API key for this provider
  if (userApiKeys[model.provider]) {
    return true;
  }

  // Paid users can use OmniChat's API keys
  if (getUserTier(user) === UserTier.PAID) {
    return true;
  }

  return false;
}

export function getModelAccessReason(
  model: { provider: string },
  user: User | null,
  userApiKeys: Record<string, string>
): { canAccess: boolean; reason?: string } {
  // Local models
  if (model.provider === 'ollama') {
    return { canAccess: true };
  }

  // User has API key
  if (userApiKeys[model.provider]) {
    return { canAccess: true, reason: 'Using your API key' };
  }

  // Paid user
  if (getUserTier(user) === UserTier.PAID) {
    return { canAccess: true, reason: 'Using OmniChat credits' };
  }

  // Free user without API key
  return {
    canAccess: false,
    reason: UPGRADE_MESSAGES.apiKey,
  };
}
