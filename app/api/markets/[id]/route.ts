import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Market } from '../route';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * GET /api/markets/[id]
 * Retrieves a specific market by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get market data
    const market = await redis.hgetall(`market:${id}`);
    
    if (!market || Object.keys(market).length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    // Get bets for this market
    const betIds = await redis.smembers(`market:${id}:bets`);
    const betsPromises = betIds.map(async (betId) => {
      return await redis.hgetall(`bet:${betId}`);
    });
    
    const bets = await Promise.all(betsPromises);
    
    return NextResponse.json({ 
      market: market as unknown as Market, 
      bets 
    });
  } catch (error) {
    console.error(`Error fetching market ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch market' }, { status: 500 });
  }
}

/**
 * PUT /api/markets/[id]
 * Updates a market (for resolving outcomes)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { resolved, outcome } = body;
    
    // Get existing market
    const existingMarket = await redis.hgetall(`market:${id}`);
    
    if (!existingMarket || Object.keys(existingMarket).length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    // Only allow resolving markets
    if (resolved !== undefined && outcome !== undefined) {
      const updatedMarket = {
        ...existingMarket,
        resolved,
        outcome
      };
      
      await redis.hset(`market:${id}`, updatedMarket);
      
      return NextResponse.json({ 
        market: updatedMarket 
      });
    }
    
    return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
  } catch (error) {
    console.error(`Error updating market ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update market' }, { status: 500 });
  }
}

/**
 * DELETE /api/markets/[id]
 * Deletes a market (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if market exists
    const market = await redis.hgetall(`market:${id}`);
    
    if (!market || Object.keys(market).length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    // Delete market and related data
    await redis.del(`market:${id}`);
    await redis.srem('markets', id);
    
    // Get and delete all bets for this market
    const betIds = await redis.smembers(`market:${id}:bets`);
    for (const betId of betIds) {
      await redis.del(`bet:${betId}`);
    }
    await redis.del(`market:${id}:bets`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting market ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete market' }, { status: 500 });
  }
}

