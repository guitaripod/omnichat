'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    type: string;
    plan?: string;
    batteryUnits: number;
  } | null>(null);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // In a real app, you'd verify the session with your backend
    // For now, we'll just show a success message
    setTimeout(() => {
      setLoading(false);
      setPurchaseDetails({
        type: 'subscription', // or 'battery'
        plan: 'Daily',
        batteryUnits: 18000,
      });
    }, 1000);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Welcome to OmniChat!</CardTitle>
          <CardDescription className="mt-2 text-lg">Your purchase was successful</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {purchaseDetails && purchaseDetails.type === 'subscription' ? (
            <>
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="mb-2 text-lg font-semibold">
                  {purchaseDetails.plan} Plan Activated
                </h3>
                <p className="text-muted-foreground mb-4">
                  You now have access to all the features of the {purchaseDetails?.plan} plan.
                </p>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  {purchaseDetails?.batteryUnits?.toLocaleString()} Battery Units
                </div>
                <p className="text-muted-foreground mt-2 text-sm">Added to your account</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">What's next?</h4>
                <div className="mx-auto grid max-w-sm gap-2 text-left text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span>Start chatting with any AI model</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span>Upload files and generate images</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span>Track your usage in the billing dashboard</span>
                  </div>
                </div>
              </div>
            </>
          ) : purchaseDetails ? (
            <div className="bg-secondary rounded-lg p-6">
              <h3 className="mb-2 text-lg font-semibold">Battery Pack Purchased</h3>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <Zap className="h-6 w-6 text-yellow-500" />
                {purchaseDetails.batteryUnits.toLocaleString()} Battery Units
              </div>
              <p className="text-muted-foreground mt-2 text-sm">Added to your account</p>
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
            <Button asChild>
              <Link href="/chat">
                Start Chatting
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/billing">View Billing Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground mt-8 text-center text-sm">
        <p>
          Need help? Check out our{' '}
          <Link href="/docs" className="underline">
            documentation
          </Link>{' '}
          or{' '}
          <Link href="/support" className="underline">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
