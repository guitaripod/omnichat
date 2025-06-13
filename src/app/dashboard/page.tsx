'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { useConversationStore } from '@/store/conversations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Cpu,
  MessageSquare,
  Zap,
  Calendar,
  Download,
  Crown,
  AlertCircle,
  Brain,
  Sparkles,
  FolderArchive,
} from 'lucide-react';
import { PremiumBadge } from '@/components/premium-badge';
import { PremiumExportDialog } from '@/components/export/premium-export-dialog';
import { AI_MODELS } from '@/services/ai';

interface UsageData {
  date: string;
  messageCount: number;
  tokenCount: number;
  modelUsage: Record<string, number>;
  costSaved: number;
}

interface ModelUsageStats {
  modelId: string;
  messageCount: number;
  tokenCount: number;
  percentage: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const conversations = useConversationStore((state) => state.conversations);
  const messages = useConversationStore((state) => state.messages);

  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [modelStats, setModelStats] = useState<ModelUsageStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalMessages: 0,
    totalTokens: 0,
    totalConversations: 0,
    totalCostSaved: 0,
    averageMessagesPerDay: 0,
    peakUsageDay: '',
    favoriteModel: '',
  });
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const isPremium =
    user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';

  // Redirect if not premium
  useEffect(() => {
    if (user && !isPremium) {
      router.push('/pricing');
    }
  }, [user, isPremium, router]);

  // Calculate usage statistics
  useEffect(() => {
    if (!messages || !conversations) return;

    // Process all messages to calculate stats
    const usageByDate: Record<string, UsageData> = {};
    const modelUsageTotals: Record<string, { messages: number; tokens: number }> = {};
    let totalMessages = 0;
    let totalTokens = 0;

    // Get current date for filtering
    const now = new Date();
    const startDate = new Date();
    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate.setFullYear(2020); // All time
    }

    Object.entries(messages).forEach(([_conversationId, conversationMessages]) => {
      conversationMessages.forEach((message) => {
        const messageDate = new Date(message.createdAt);
        if (messageDate < startDate) return;

        const dateKey = messageDate.toISOString().split('T')[0];

        if (!usageByDate[dateKey]) {
          usageByDate[dateKey] = {
            date: dateKey,
            messageCount: 0,
            tokenCount: 0,
            modelUsage: {},
            costSaved: 0,
          };
        }

        usageByDate[dateKey].messageCount++;
        totalMessages++;

        // Estimate tokens (rough approximation)
        const estimatedTokens = Math.ceil(message.content.length / 4);
        usageByDate[dateKey].tokenCount += estimatedTokens;
        totalTokens += estimatedTokens;

        // Track model usage
        const modelId = message.model || 'unknown';
        if (!usageByDate[dateKey].modelUsage[modelId]) {
          usageByDate[dateKey].modelUsage[modelId] = 0;
        }
        usageByDate[dateKey].modelUsage[modelId]++;

        if (!modelUsageTotals[modelId]) {
          modelUsageTotals[modelId] = { messages: 0, tokens: 0 };
        }
        modelUsageTotals[modelId].messages++;
        modelUsageTotals[modelId].tokens += estimatedTokens;

        // Estimate cost saved (vs API pricing)
        const modelInfo = Object.values(AI_MODELS)
          .flat()
          .find((m) => m.id === modelId);
        if (modelInfo) {
          // Rough cost estimation: $0.01 per 1K tokens for premium models
          const estimatedCost = (estimatedTokens / 1000) * 0.01;
          usageByDate[dateKey].costSaved += estimatedCost;
        }
      });
    });

    // Convert to array and sort by date
    const sortedUsageData = Object.values(usageByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate model statistics
    const modelStatsArray: ModelUsageStats[] = Object.entries(modelUsageTotals)
      .map(([modelId, stats]) => ({
        modelId,
        messageCount: stats.messages,
        tokenCount: stats.tokens,
        percentage: totalMessages > 0 ? (stats.messages / totalMessages) * 100 : 0,
      }))
      .sort((a, b) => b.messageCount - a.messageCount);

    // Find peak usage day and favorite model
    let peakUsageDay = '';
    let maxMessages = 0;
    sortedUsageData.forEach((data) => {
      if (data.messageCount > maxMessages) {
        maxMessages = data.messageCount;
        peakUsageDay = data.date;
      }
    });

    const favoriteModel = modelStatsArray[0]?.modelId || 'N/A';
    const totalCostSaved = sortedUsageData.reduce((sum, data) => sum + data.costSaved, 0);
    const averageMessagesPerDay =
      sortedUsageData.length > 0 ? totalMessages / sortedUsageData.length : 0;

    setUsageData(sortedUsageData);
    setModelStats(modelStatsArray);
    setTotalStats({
      totalMessages,
      totalTokens,
      totalConversations: Object.keys(conversations).length,
      totalCostSaved,
      averageMessagesPerDay: Math.round(averageMessagesPerDay),
      peakUsageDay,
      favoriteModel,
    });
  }, [messages, conversations, timeRange]);

  if (!user || !isPremium) {
    return null;
  }

  const modelIconMap: Record<string, React.ReactElement> = {
    openai: <Sparkles className="h-4 w-4" />,
    anthropic: <Brain className="h-4 w-4" />,
    google: <Zap className="h-4 w-4" />,
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            Premium Dashboard
            <PremiumBadge size="sm" showText />
          </h1>
          <p className="text-muted-foreground mt-1">Track your usage, performance, and savings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20"
          >
            <FolderArchive className="mr-2 h-4 w-4" />
            Batch Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Tabs defaultValue={timeRange}>
        <TabsList>
          <TabsTrigger value="week" onClick={() => setTimeRange('week')}>
            Last 7 Days
          </TabsTrigger>
          <TabsTrigger value="month" onClick={() => setTimeRange('month')}>
            Last 30 Days
          </TabsTrigger>
          <TabsTrigger value="all" onClick={() => setTimeRange('all')}>
            All Time
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalMessages.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">
              {totalStats.averageMessagesPerDay} per day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Cpu className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalStats.totalTokens / 1000).toFixed(1)}K</div>
            <p className="text-muted-foreground text-xs">
              Across {totalStats.totalConversations} conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Saved</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.totalCostSaved.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">vs API pricing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Model</CardTitle>
            <Crown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-xl font-bold">{totalStats.favoriteModel}</div>
            <p className="text-muted-foreground text-xs">Most used model</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <CardDescription>Distribution of messages by AI model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {modelStats.slice(0, 5).map((stat) => {
              const modelInfo = Object.values(AI_MODELS)
                .flat()
                .find((m) => m.id === stat.modelId);
              const providerIcon = modelInfo ? (
                modelIconMap[modelInfo.provider] || <Cpu className="h-4 w-4" />
              ) : (
                <Cpu className="h-4 w-4" />
              );

              return (
                <div key={stat.modelId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{providerIcon}</span>
                      <span className="text-sm font-medium">{modelInfo?.name || stat.modelId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {stat.messageCount} messages
                      </span>
                      <Badge variant="secondary">{stat.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>Daily message activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Simple bar chart visualization */}
              <div className="space-y-2">
                {usageData.slice(-7).map((data) => {
                  const date = new Date(data.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const percentage =
                    totalStats.totalMessages > 0
                      ? (data.messageCount / totalStats.totalMessages) * 100
                      : 0;

                  return (
                    <div key={data.date} className="flex items-center gap-3">
                      <span className="text-muted-foreground w-10 text-sm">{dayName}</span>
                      <div className="flex-1">
                        <Progress value={percentage * 5} className="h-6" />
                      </div>
                      <span className="w-12 text-right text-sm font-medium">
                        {data.messageCount}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Peak usage indicator */}
              {totalStats.peakUsageDay && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground text-sm">
                    Peak usage on{' '}
                    {new Date(totalStats.peakUsageDay).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Features Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Features</CardTitle>
          <CardDescription>Your exclusive capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">15+ AI Models</h4>
                <p className="text-muted-foreground text-sm">Access to all premium models</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Priority Processing</h4>
                <p className="text-muted-foreground text-sm">10x faster response times</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium">Export & Analytics</h4>
                <p className="text-muted-foreground text-sm">Download your data anytime</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button onClick={() => router.push('/chat')} className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          New Conversation
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/images')}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate Images
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/billing')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Manage Subscription
        </Button>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <PremiumExportDialog isOpen={true} onClose={() => setShowExportDialog(false)} />
      )}
    </div>
  );
}
