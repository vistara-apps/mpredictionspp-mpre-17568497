import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface Market {
  id: string;
  question: string;
  description: string;
  creator: string;
  createdAt: number;
  expiresAt: number;
  totalYesAmount: string;
  totalNoAmount: string;
  resolved: boolean;
  outcome?: boolean;
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'whisper';
  accessList?: string[]; // List of addresses or FIDs that can access private markets
}

export interface Bet {
  marketId: string;
  bettor: string;
  outcome: boolean;
  amount: string;
  timestamp: number;
}

/**
 * GET /api/markets
 * Retrieves all markets or filtered by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');
    const creator = searchParams.get('creator');
    const resolved = searchParams.get('resolved');
    const tag = searchParams.get('tag');
    
    // Get all market IDs
    const marketIds = await redis.smembers('markets');
    
    // Get market data for each ID
    const marketsPromises = marketIds.map(async (id) => {
      const market = await redis.hgetall(`market:${id}`);
      return market as unknown as Market;
    });
    
    let markets = await Promise.all(marketsPromises);
    
    // Apply filters
    if (category) {
      markets = markets.filter(market => market.category === category);
    }
    
    if (visibility) {
      markets = markets.filter(market => market.visibility === visibility);
    }
    
    if (creator) {
      markets = markets.filter(market => market.creator === creator);
    }
    
    if (resolved !== null) {
      const isResolved = resolved === 'true';
      markets = markets.filter(market => market.resolved === isResolved);
    }
    
    if (tag) {
      markets = markets.filter(market => market.tags.includes(tag));
    }
    
    return NextResponse.json({ markets });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}

/**
 * POST /api/markets
 * Creates a new prediction market
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      question, 
      description, 
      creator, 
      expiresAt, 
      category, 
      tags, 
      visibility, 
      accessList 
    } = body;
    
    // Validate required fields
    if (!question || !description || !creator || !expiresAt || !category || !visibility) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Generate unique ID
    const id = `market_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const market: Market = {
      id,
      question,
      description,
      creator,
      createdAt: Date.now(),
      expiresAt,
      totalYesAmount: '0',
      totalNoAmount: '0',
      resolved: false,
      category,
      tags: tags || [],
      visibility,
      accessList: visibility === 'private' ? accessList : undefined,
    };
    
    // Store market in Redis
    await redis.hset(`market:${id}`, market);
    await redis.sadd('markets', id);
    
    return NextResponse.json({ market }, { status: 201 });
  } catch (error) {
    console.error('Error creating market:', error);
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 });
  }
}

