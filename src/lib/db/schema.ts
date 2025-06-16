import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    imageUrl: text('image_url'),
    clerkId: text('clerk_id').unique(),
    stripeCustomerId: text('stripe_customer_id').unique(),
    subscriptionId: text('subscription_id'),
    subscriptionStatus: text('subscription_status'),
    tier: text('tier', { enum: ['free', 'paid'] })
      .notNull()
      .default('free'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
    clerkIdx: index('clerk_idx').on(table.clerkId),
  })
);

// Conversations table
export const conversations = sqliteTable(
  'conversations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    model: text('model').notNull(),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userIdx: index('user_idx').on(table.userId),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  })
);

// Messages table
export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),
    model: text('model'),
    parentId: text('parent_id'),
    // Streaming state fields
    isComplete: integer('is_complete', { mode: 'boolean' }).notNull().default(true),
    streamState: text('stream_state'), // JSON string containing streaming metadata
    tokensGenerated: integer('tokens_generated').notNull().default(0),
    totalTokens: integer('total_tokens'), // Estimated total tokens (if available)
    streamId: text('stream_id'), // Unique ID for resuming streams
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    conversationIdx: index('conversation_idx').on(table.conversationId),
    parentIdx: index('parent_idx').on(table.parentId),
    createdAtIdx: index('msg_created_at_idx').on(table.createdAt),
    incompleteIdx: index('idx_messages_incomplete').on(table.conversationId, table.isComplete),
    streamIdIdx: index('idx_messages_stream_id').on(table.streamId),
  })
);

// Attachments table
export const attachments = sqliteTable(
  'attachments',
  {
    id: text('id').primaryKey(),
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(),
    r2Key: text('r2_key').notNull(),
    url: text('url').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    messageIdx: index('message_idx').on(table.messageId),
  })
);

// API Usage table
export const apiUsage = sqliteTable(
  'api_usage',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    cost: integer('cost').notNull(), // Store in cents
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userUsageIdx: index('user_usage_idx').on(table.userId),
    createdAtUsageIdx: index('created_at_usage_idx').on(table.createdAt),
  })
);

// Subscription plans table
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  priceMonthly: integer('price_monthly').notNull(), // in cents
  priceAnnual: integer('price_annual').notNull(), // in cents
  batteryUnits: integer('battery_units').notNull(),
  dailyBattery: integer('daily_battery').notNull(),
  features: text('features').notNull(), // JSON array
  stripePriceIdMonthly: text('stripe_price_id_monthly'),
  stripePriceIdAnnual: text('stripe_price_id_annual'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// User subscriptions table
export const userSubscriptions = sqliteTable(
  'user_subscriptions',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id')
      .notNull()
      .references(() => subscriptionPlans.id),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    status: text('status', {
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'],
    }).notNull(),
    currentPeriodStart: text('current_period_start').notNull(),
    currentPeriodEnd: text('current_period_end').notNull(),
    cancelAt: text('cancel_at'),
    canceledAt: text('canceled_at'),
    trialEnd: text('trial_end'),
    billingInterval: text('billing_interval', {
      enum: ['monthly', 'annual'],
    }),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userIdIdx: index('idx_user_subscriptions_user_id').on(table.userId),
    statusIdx: index('idx_user_subscriptions_status').on(table.status),
  })
);

// User battery balance table
export const userBattery = sqliteTable('user_battery', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalBalance: integer('total_balance').notNull().default(0),
  dailyAllowance: integer('daily_allowance').notNull().default(0),
  lastDailyReset: text('last_daily_reset')
    .notNull()
    .default(sql`(date('now'))`),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Battery transactions table
export const batteryTransactions = sqliteTable(
  'battery_transactions',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: ['purchase', 'subscription', 'subscription_upgrade', 'bonus', 'refund', 'usage'],
    }).notNull(),
    amount: integer('amount').notNull(), // positive for credits, negative for usage
    balanceAfter: integer('balance_after').notNull(),
    description: text('description'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    metadata: text('metadata'), // JSON
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userIdIdx: index('idx_battery_transactions_user_id').on(table.userId),
    createdAtIdx: index('idx_battery_transactions_created_at').on(table.createdAt),
  })
);

// Enhanced API usage tracking table
export const apiUsageTracking = sqliteTable(
  'api_usage',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conversationId: text('conversation_id').notNull(),
    messageId: text('message_id').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    batteryUsed: integer('battery_used').notNull(),
    cached: integer('cached', { mode: 'boolean' }).default(false),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    date: text('date')
      .notNull()
      .default(sql`(date('now'))`), // for daily aggregation
  },
  (table) => ({
    userIdDateIdx: index('idx_api_usage_user_id_date').on(table.userId, table.date),
    conversationIdIdx: index('idx_api_usage_conversation_id').on(table.conversationId),
  })
);

// Daily usage summary table
export const dailyUsageSummary = sqliteTable(
  'daily_usage_summary',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    totalBatteryUsed: integer('total_battery_used').notNull().default(0),
    totalMessages: integer('total_messages').notNull().default(0),
    modelsUsed: text('models_used').notNull().default('{}'), // JSON object
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userDateIdx: index('idx_daily_usage_summary_user_date').on(table.userId, table.date),
  })
);

// Audit logs table
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: text('resource_id'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: text('metadata'), // JSON string for additional data
    status: text('status', { enum: ['success', 'failure', 'error'] }).notNull(),
    errorMessage: text('error_message'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
    statusIdx: index('idx_audit_logs_status').on(table.status),
    resourceIdx: index('idx_audit_logs_resource').on(table.resource),
    userTimeIdx: index('idx_audit_logs_user_time').on(table.userId, table.createdAt),
  })
);

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type UserBattery = typeof userBattery.$inferSelect;
export type NewUserBattery = typeof userBattery.$inferInsert;
export type BatteryTransaction = typeof batteryTransactions.$inferSelect;
export type NewBatteryTransaction = typeof batteryTransactions.$inferInsert;
export type ApiUsageTracking = typeof apiUsageTracking.$inferSelect;
export type NewApiUsageTracking = typeof apiUsageTracking.$inferInsert;
export type DailyUsageSummary = typeof dailyUsageSummary.$inferSelect;
export type NewDailyUsageSummary = typeof dailyUsageSummary.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
