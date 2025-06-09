import { FileAttachment } from './attachments';

export interface User {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscriptionId: string | null;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: ModelType;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: ModelType;
  createdAt: Date;
  parentId?: string | null;
  attachments?: FileAttachment[];
}

export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: Date;
}

export type ModelType = string; // Allow any model ID for flexibility

export interface ApiUsage {
  id: string;
  userId: string;
  model: ModelType;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  tier: 'free' | 'pro' | 'enterprise';
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}
