import { Market, Bet } from '../api/markets/route';

const API_BASE_URL = '/api';

/**
 * Fetches all markets or filtered by query parameters
 */
export async function getMarkets(params?: {
  category?: string;
  visibility?: 'public' | 'private' | 'whisper';
  creator?: string;
  resolved?: boolean;
  tag?: string;
}): Promise<Market[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.category) queryParams.append('category', params.category);
  if (params?.visibility) queryParams.append('visibility', params.visibility);
  if (params?.creator) queryParams.append('creator', params.creator);
  if (params?.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());
  if (params?.tag) queryParams.append('tag', params.tag);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${API_BASE_URL}/markets${queryString}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.markets;
}

/**
 * Fetches a specific market by ID
 */
export async function getMarket(id: string): Promise<{ market: Market; bets: Bet[] }> {
  const response = await fetch(`${API_BASE_URL}/markets/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Creates a new prediction market
 */
export async function createMarket(marketData: {
  question: string;
  description: string;
  creator: string;
  expiresAt: number;
  category: string;
  tags?: string[];
  visibility: 'public' | 'private' | 'whisper';
  accessList?: string[];
}): Promise<Market> {
  const response = await fetch(`${API_BASE_URL}/markets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(marketData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create market: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.market;
}

/**
 * Resolves a market with an outcome
 */
export async function resolveMarket(id: string, outcome: boolean): Promise<Market> {
  const response = await fetch(`${API_BASE_URL}/markets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolved: true, outcome }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to resolve market: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.market;
}

/**
 * Places a bet on a market
 */
export async function placeBet(betData: {
  marketId: string;
  bettor: string;
  outcome: boolean;
  amount: string;
}): Promise<Bet> {
  const response = await fetch(`${API_BASE_URL}/bets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(betData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to place bet: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.bet;
}

/**
 * Fetches bets for a specific market or user
 */
export async function getBets(params?: {
  marketId?: string;
  bettor?: string;
}): Promise<Bet[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.marketId) queryParams.append('marketId', params.marketId);
  if (params?.bettor) queryParams.append('bettor', params.bettor);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await fetch(`${API_BASE_URL}/bets${queryString}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch bets: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.bets;
}

