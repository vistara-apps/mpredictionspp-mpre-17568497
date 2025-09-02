import { NextRequest, NextResponse } from 'next/server';
import { getFrameMessage, FrameRequest } from '@coinbase/onchainkit/frame';
import { Redis } from '@upstash/redis';
import { Market } from '../markets/route';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Base URL for the application
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mpredictionspp.vistara.dev';

/**
 * GET /api/frame
 * Serves the initial frame
 */
export async function GET(request: NextRequest) {
  // Get top markets
  const marketIds = await redis.smembers('markets');
  const marketsPromises = marketIds.slice(0, 5).map(async (id) => {
    return await redis.hgetall(`market:${id}`) as unknown as Market;
  });
  
  const markets = await Promise.all(marketsPromises);
  
  // Sort by total amount (yes + no)
  markets.sort((a, b) => {
    const totalA = BigInt(a.totalYesAmount || '0') + BigInt(a.totalNoAmount || '0');
    const totalB = BigInt(b.totalYesAmount || '0') + BigInt(b.totalNoAmount || '0');
    return totalB > totalA ? 1 : -1;
  });
  
  // Get the top market
  const featuredMarket = markets[0];
  
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${BASE_URL}/api/og?marketId=${featuredMarket?.id || ''}" />
        <meta property="fc:frame:button:1" content="View Market" />
        <meta property="fc:frame:button:2" content="Bet Yes" />
        <meta property="fc:frame:button:3" content="Bet No" />
        <meta property="fc:frame:button:4" content="More Markets" />
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame" />
      </head>
      <body>
        <h1>Whisper Network Prediction Market</h1>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

/**
 * POST /api/frame
 * Handles frame interactions
 */
export async function POST(request: NextRequest) {
  const body: FrameRequest = await request.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: process.env.NEYNAR_API_KEY });
  
  if (!isValid) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${BASE_URL}/error.png" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame" />
        </head>
        <body>
          <h1>Invalid request</h1>
        </body>
      </html>`,
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
  
  const buttonIndex = message.button;
  const fid = message.interactor.fid;
  
  // Get state from previous frame if available
  const state = message.state ? JSON.parse(message.state) : { page: 1, marketId: null };
  
  // Handle different button actions
  if (buttonIndex === 1) {
    // View Market - redirect to the web app
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${BASE_URL}/redirect.png" />
          <meta property="fc:frame:button:1" content="Go to App" />
          <meta property="fc:redirect" content="${BASE_URL}/market/${state.marketId}" />
        </head>
        <body>
          <h1>Redirecting to market details...</h1>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } else if (buttonIndex === 2 || buttonIndex === 3) {
    // Bet Yes or No - redirect to the web app with prefilled bet
    const outcome = buttonIndex === 2;
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${BASE_URL}/bet.png" />
          <meta property="fc:frame:button:1" content="Place Bet" />
          <meta property="fc:redirect" content="${BASE_URL}/market/${state.marketId}?action=bet&outcome=${outcome ? 'yes' : 'no'}" />
        </head>
        <body>
          <h1>Redirecting to place your bet...</h1>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } else if (buttonIndex === 4) {
    // More Markets - show next page of markets
    const page = state.page || 1;
    const nextPage = page + 1;
    
    // Get markets for the next page
    const marketIds = await redis.smembers('markets');
    const startIdx = (nextPage - 1) * 5;
    const endIdx = startIdx + 5;
    
    if (startIdx >= marketIds.length) {
      // If we've reached the end, go back to the first page
      state.page = 1;
      const firstPageMarkets = marketIds.slice(0, 5);
      const marketsPromises = firstPageMarkets.map(async (id) => {
        return await redis.hgetall(`market:${id}`) as unknown as Market;
      });
      
      const markets = await Promise.all(marketsPromises);
      const featuredMarket = markets[0];
      
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${BASE_URL}/api/og?marketId=${featuredMarket?.id || ''}" />
            <meta property="fc:frame:button:1" content="View Market" />
            <meta property="fc:frame:button:2" content="Bet Yes" />
            <meta property="fc:frame:button:3" content="Bet No" />
            <meta property="fc:frame:button:4" content="More Markets" />
            <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame" />
            <meta property="fc:frame:state" content='${JSON.stringify({ page: 1, marketId: featuredMarket?.id })}' />
          </head>
          <body>
            <h1>Whisper Network Prediction Market</h1>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }
    
    const nextPageMarkets = marketIds.slice(startIdx, endIdx);
    const marketsPromises = nextPageMarkets.map(async (id) => {
      return await redis.hgetall(`market:${id}`) as unknown as Market;
    });
    
    const markets = await Promise.all(marketsPromises);
    const featuredMarket = markets[0];
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${BASE_URL}/api/og?marketId=${featuredMarket?.id || ''}" />
          <meta property="fc:frame:button:1" content="View Market" />
          <meta property="fc:frame:button:2" content="Bet Yes" />
          <meta property="fc:frame:button:3" content="Bet No" />
          <meta property="fc:frame:button:4" content="More Markets" />
          <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame" />
          <meta property="fc:frame:state" content='${JSON.stringify({ page: nextPage, marketId: featuredMarket?.id })}' />
        </head>
        <body>
          <h1>Whisper Network Prediction Market</h1>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
  
  // Default response
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${BASE_URL}/error.png" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame" />
      </head>
      <body>
        <h1>Invalid action</h1>
      </body>
    </html>`,
    {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

