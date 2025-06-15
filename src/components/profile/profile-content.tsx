'use client';

import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import ApiSettings from '@/components/profile/api-settings';
import { PageHeader } from '@/components/layout/page-header';
import {
  Shield,
  Activity,
  Sparkles,
  Battery,
  User,
  Calendar,
  Crown,
  Key,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { UserResource } from '@clerk/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/use-user-data';
import { getPlanName } from '@/lib/subscription-plans';

interface ProfileContentProps {
  user: UserResource;
}

// Animated background
function ProfileBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/4 -right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 opacity-10 blur-3xl dark:from-purple-700 dark:to-pink-700" />
      <div className="absolute -bottom-1/4 -left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 opacity-10 blur-3xl dark:from-blue-700 dark:to-cyan-700" />
    </div>
  );
}

// Compact stat card
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
      <div className={cn('rounded-lg p-2', color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

// Quick action card
function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <div className={cn('rounded-lg p-3', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
      </motion.div>
    </Link>
  );
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const [activeTab] = useState('overview');
  const { subscription } = useUserData();

  return (
    <>
      <PageHeader title="Profile Settings" />

      <div className="relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <ProfileBackground />

        <div className="relative container mx-auto max-w-6xl px-4 py-8">
          {/* Compact User Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl dark:from-gray-800 dark:to-gray-900">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6 md:flex-row">
                  {/* User Avatar */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-xl" />
                    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonAvatarBox: 'h-20 w-20 ring-4 ring-white dark:ring-gray-800',
                          },
                        }}
                      />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center gap-2 md:justify-start">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </h2>
                      {subscription && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          <Crown className="mr-1 h-3 w-3" />
                          {subscription.planId ? getPlanName(subscription.planId) : 'Premium'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {user.primaryEmailAddress?.emailAddress ||
                        user.emailAddresses?.[0]?.emailAddress ||
                        'No email'}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
                    <StatCard
                      icon={Calendar}
                      label="Member Since"
                      value={
                        user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'
                      }
                      color="bg-blue-500"
                    />
                    <StatCard icon={Activity} label="Status" value="Active" color="bg-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 grid gap-4 md:grid-cols-3"
          >
            <QuickAction
              icon={Sparkles}
              title="Subscription"
              description="Manage your plan"
              href="/pricing"
              color="bg-gradient-to-br from-purple-500 to-pink-600"
            />
            <QuickAction
              icon={Battery}
              title="Battery Usage"
              description="Monitor your credits"
              href="/billing"
              color="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <QuickAction
              icon={Shield}
              title="Security"
              description="Privacy settings"
              href="/security"
              color="bg-gradient-to-br from-green-500 to-emerald-600"
            />
          </motion.div>

          {/* Tabbed Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl">
              <Tabs defaultValue={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 p-1">
                  <TabsTrigger value="overview" className="gap-2">
                    <User className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="api-keys" className="gap-2">
                    <Key className="h-4 w-4" />
                    API Keys
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">Account Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              User ID
                            </span>
                            <span className="font-mono text-sm">{user.id.slice(0, 12)}...</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                            <span className="text-sm">
                              {user.primaryEmailAddress?.emailAddress || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Plan</span>
                            <Badge variant="secondary">Premium</Badge>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Battery
                            </span>
                            <span className="text-sm font-medium text-green-600">Unlimited</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-4 text-lg font-semibold">Quick Stats</h3>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold">42</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Conversations
                                </p>
                              </div>
                              <Zap className="h-8 w-8 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold">156</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                              </div>
                              <Activity className="h-8 w-8 text-purple-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold">5</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  AI Models
                                </p>
                              </div>
                              <Sparkles className="h-8 w-8 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold">∞</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Battery</p>
                              </div>
                              <Battery className="h-8 w-8 text-orange-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="api-keys" className="mt-0">
                    <ApiSettings />
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0 space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Receive updates about your account
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                          <div>
                            <p className="font-medium">Data Export</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Download your conversation history
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Export
                          </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                          <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Permanently delete your account
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
