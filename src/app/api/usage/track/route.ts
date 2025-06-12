import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { trackApiUsage } from '@/lib/usage-tracking';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

interface TrackUsageRequest {
  conversationId: string;
  messageId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cached?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const clerkUser = await currentUser();

    let userId: string;

    if (clerkUser) {
      userId = clerkUser.id;
    } else if (isDevMode()) {
      const devUser = await getDevUser();
      if (devUser) {
        userId = devUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: TrackUsageRequest = await req.json();
    const { conversationId, messageId, model, inputTokens, outputTokens, cached = false } = body;

    // Skip tracking for Ollama models (they're free)
    if (model.startsWith('ollama/')) {
      return NextResponse.json({
        success: true,
        batteryUsed: 0,
        message: 'Ollama models are free',
      });
    }

    // Validate required fields
    if (
      !conversationId ||
      !messageId ||
      !model ||
      inputTokens === undefined ||
      outputTokens === undefined
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Track the usage
    const result = await trackApiUsage({
      userId,
      conversationId,
      messageId,
      model,
      inputTokens,
      outputTokens,
      cached,
    });

    return NextResponse.json({
      success: true,
      batteryUsed: result.batteryUsed,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error('Usage tracking error:', error);

    if (error instanceof Error && error.message === 'Insufficient battery balance') {
      return NextResponse.json({ error: 'Insufficient battery balance' }, { status: 402 });
    }

    return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
  }
}
