'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getClientConfig } from '@/lib/client-config';

export function StripeDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<{
    publishableKey: boolean;
    stripeLoaded: boolean;
    apiHealth: boolean;
    errorDetails: string[];
  }>({
    publishableKey: false,
    stripeLoaded: false,
    apiHealth: false,
    errorDetails: [],
  });

  useEffect(() => {
    const errors: string[] = [];

    // Check configuration and Stripe loading
    const runDiagnostics = async () => {
      let hasKey = false;
      let pubKey = '';

      try {
        // First try runtime config
        const config = await getClientConfig();
        pubKey = config.stripe.publishableKey;
        hasKey = !!pubKey;

        if (!hasKey) {
          errors.push('Stripe publishable key not found in runtime config');
        } else {
          console.log(
            '[Diagnostic] Stripe key from runtime config:',
            pubKey.substring(0, 20) + '...'
          );
        }
      } catch (configError) {
        errors.push(
          `Config load error: ${configError instanceof Error ? configError.message : 'Unknown'}`
        );

        // Fallback to env var
        pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
        hasKey = !!pubKey;

        if (!hasKey) {
          errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
        } else {
          console.log('[Diagnostic] Stripe key from env:', pubKey.substring(0, 20) + '...');
        }
      }

      // Check if Stripe can load
      const checkStripeLoad = async () => {
        try {
          if (!pubKey) {
            errors.push('Cannot load Stripe without publishable key');
            return false;
          }

          const { loadStripe } = await import('@stripe/stripe-js');
          const stripe = await loadStripe(pubKey);

          if (!stripe) {
            errors.push('Stripe loaded but returned null');
            return false;
          }

          console.log('[Diagnostic] Stripe loaded successfully');
          return true;
        } catch (error) {
          errors.push(`Stripe load error: ${error instanceof Error ? error.message : 'Unknown'}`);
          return false;
        }
      };

      // Check API health
      const checkApiHealth = async () => {
        try {
          const response = await fetch('/api/stripe/checkout', {
            method: 'GET',
          });

          if (!response.ok) {
            errors.push(`API health check failed: ${response.status}`);
            return false;
          }

          return true;
        } catch (error) {
          errors.push(
            `API connection error: ${error instanceof Error ? error.message : 'Unknown'}`
          );
          return false;
        }
      };

      // Run all checks
      const [stripeLoaded, apiHealth] = await Promise.all([checkStripeLoad(), checkApiHealth()]);

      setDiagnostics({
        publishableKey: hasKey,
        stripeLoaded,
        apiHealth,
        errorDetails: errors,
      });
    };

    runDiagnostics();
  }, []);

  const allChecksPass =
    diagnostics.publishableKey && diagnostics.stripeLoaded && diagnostics.apiHealth;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Stripe Integration Diagnostic
          {allChecksPass ? (
            <Badge className="bg-green-500">All Systems Go</Badge>
          ) : (
            <Badge className="bg-red-500">Issues Detected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {diagnostics.publishableKey ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span>Stripe Publishable Key</span>
          </div>

          <div className="flex items-center gap-2">
            {diagnostics.stripeLoaded ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span>Stripe SDK Loading</span>
          </div>

          <div className="flex items-center gap-2">
            {diagnostics.apiHealth ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span>API Endpoint Health</span>
          </div>
        </div>

        {diagnostics.errorDetails.length > 0 && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
              <div className="space-y-1">
                <p className="font-semibold text-red-700 dark:text-red-400">Error Details:</p>
                {diagnostics.errorDetails.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-300">
                    • {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
