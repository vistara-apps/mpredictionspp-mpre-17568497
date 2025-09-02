import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Market, Bet } from '../markets/route';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * GET /api/bets
 * Retrieves bets filtered by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    const bettor = searchParams.get('bettor');
    
    // Get all bet IDs
    let betIds: string[] = [];
    
    if (marketId) {
      // Get bets for specific market
      betIds = await redis.smembers(`market:${marketId}:bets`);
    } else {
      // Get all bets
      betIds = await redis.smembers('bets');
    }
    
    // Get bet data for each ID
    const betsPromises = betIds.map(async (id) => {
      const bet = await redis.hgetall(`bet:${id}`);
      return bet as unknown as Bet;
    });
    
    let bets = await Promise.all(betsPromises);
    
    // Filter by bettor if specified
    if (bettor) {
      bets = bets.filter(bet => bet.bettor === bettor);
    }
    
    return NextResponse.json({ bets });
  } catch (error) {
    console.error('Error fetching bets:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

/**
 * POST /api/bets
 * Places a new bet on a market
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, bettor, outcome, amount } = body;
    
    // Validate required fields
    if (!marketId || !bettor || outcome === undefined || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Check if market exists
    const market = await redis.hgetall(`market:${marketId}`) as unknown as Market;
    
    if (!market || Object.keys(market).length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    // Check if market is still open
    if (market.resolved) {
      return NextResponse.json({ error: 'Market is already resolved' }, { status: 400 });
    }
    
    if (market.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Market has expired' }, { status: 400 });
    }
    
    // Check access for private markets
    if (market.visibility === 'private' && market.accessList) {
      if (!market.accessList.includes(bettor)) {
        return NextResponse.json({ error: 'No access to this private market' }, { status: 403 });
      }
    }
    
    // Generate unique ID for bet
    const betId = `bet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const bet: Bet = {
      marketId,
      bettor,
      outcome,
      amount,
      timestamp: Date.now(),
    };
    
    // Update market totals
    const amountBigInt = BigInt(amount);
    const fieldToUpdate = outcome ? 'totalYesAmount' : 'totalNoAmount';
    const currentTotal = BigInt(market[fieldToUpdate] || '0');
    const newTotal = (currentTotal + amountBigInt).toString();
    
    await redis.hset(`market:${marketId}`, {
      [fieldToUpdate]: newTotal
    });
    
    // Store bet in Redis
    await redis.hset(`bet:${betId}`, bet);
    await redis.sadd(`market:${marketId}:bets`, betId);
    await redis.sadd('bets', betId);
    
    return NextResponse.json({ bet }, { status: 201 });
  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 });
  }
}

