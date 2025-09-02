import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * POST /api/webhook
 * Handles Farcaster webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature
    const signature = request.headers.get('x-farcaster-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    // TODO: Implement signature verification with webhook secret
    
    // Process different webhook events
    const { type, data } = body;
    
    if (type === 'frame.action') {
      // Handle frame action
      const { fid, buttonIndex, castId, inputText } = data;
      
      // Log the interaction
      await redis.lpush('frame_interactions', JSON.stringify({
        fid,
        buttonIndex,
        castId,
        inputText,
        timestamp: Date.now(),
      }));
      
      // Process based on button index
      // This is just for analytics, actual frame logic is in /api/frame
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

