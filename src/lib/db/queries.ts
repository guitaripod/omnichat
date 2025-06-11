import { eq, desc, and, gte, sql } from 'drizzle-orm';
import type { Db } from './client';
import * as schema from './schema';
import { generateId } from '@/utils';

// User queries
export async function getUserByClerkId(db: Db, clerkId: string) {
  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);

  return result[0] || null;
}

export async function createUser(
  db: Db,
  userData: {
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  }
) {
  const id = generateId();
  const [user] = await db
    .insert(schema.users)
    .values({
      id,
      ...userData,
    })
    .returning();

  return user;
}

// Conversation queries
export async function getUserConversations(db: Db, userId: string) {
  return db
    .select()
    .from(schema.conversations)
    .where(and(eq(schema.conversations.userId, userId), eq(schema.conversations.isArchived, false)))
    .orderBy(desc(schema.conversations.updatedAt));
}

export async function createConversation(
  db: Db,
  data: {
    userId: string;
    title: string;
    model: string;
  }
) {
  const id = generateId();
  const [conversation] = await db
    .insert(schema.conversations)
    .values({
      id,
      ...data,
    })
    .returning();

  return conversation;
}

export async function updateConversation(
  db: Db,
  id: string,
  data: Partial<{
    title: string;
    isArchived: boolean;
  }>
) {
  const [updated] = await db
    .update(schema.conversations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.conversations.id, id))
    .returning();

  return updated;
}

// Message queries
export async function getConversationMessages(db: Db, conversationId: string) {
  const messages = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.createdAt);

  // Get attachments for all messages
  const messageIds = messages.map((m) => m.id);
  const attachments =
    messageIds.length > 0
      ? await db
          .select()
          .from(schema.attachments)
          .where(
            sql`${schema.attachments.messageId} IN (${sql.join(
              messageIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
      : [];

  // Group attachments by message
  const attachmentsByMessage = attachments.reduce(
    (acc, att) => {
      if (!acc[att.messageId]) acc[att.messageId] = [];
      acc[att.messageId].push(att);
      return acc;
    },
    {} as Record<string, typeof attachments>
  );

  // Combine messages with their attachments
  return messages.map((msg) => ({
    ...msg,
    attachments: attachmentsByMessage[msg.id] || [],
  }));
}

export async function createMessage(
  db: Db,
  data: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    parentId?: string;
  }
) {
  const id = generateId();
  const [message] = await db
    .insert(schema.messages)
    .values({
      id,
      ...data,
    })
    .returning();

  // Update conversation timestamp
  await db
    .update(schema.conversations)
    .set({ updatedAt: new Date() })
    .where(eq(schema.conversations.id, data.conversationId));

  return message;
}

// API usage tracking
export async function trackApiUsage(
  db: Db,
  data: {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }
) {
  const id = generateId();
  return db.insert(schema.apiUsage).values({
    id,
    ...data,
  });
}

export async function getUserUsageToday(db: Db, userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await db
    .select({
      totalMessages: sql<number>`count(*)`,
      totalCost: sql<number>`sum(${schema.apiUsage.cost})`,
    })
    .from(schema.apiUsage)
    .where(and(eq(schema.apiUsage.userId, userId), gte(schema.apiUsage.createdAt, today)));

  return usage[0] || { totalMessages: 0, totalCost: 0 };
}

// Subscription queries
export async function getUserSubscription(db: Db, userId: string) {
  const result = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function deleteConversation(db: Db, id: string) {
  // Delete associated messages first (cascade delete)
  await db.delete(schema.messages).where(eq(schema.messages.conversationId, id));

  // Then delete the conversation
  const [deleted] = await db
    .delete(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .returning();

  return deleted;
}

export async function createOrUpdateSubscription(
  db: Db,
  data: {
    userId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    tier: 'free' | 'pro' | 'enterprise';
  }
) {
  const existing = await getUserSubscription(db, data.userId);

  if (existing) {
    const [updated] = await db
      .update(schema.subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.userId, data.userId))
      .returning();

    return updated;
  } else {
    const id = generateId();
    const [created] = await db
      .insert(schema.subscriptions)
      .values({
        id,
        ...data,
      })
      .returning();

    return created;
  }
}
