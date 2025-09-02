import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Market } from '../markets/route';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export const runtime = 'edge';

/**
 * GET /api/og
 * Generates Open Graph images for markets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    
    let market: Market | null = null;
    
    if (marketId) {
      // Get specific market
      market = await redis.hgetall(`market:${marketId}`) as unknown as Market;
    } else {
      // Get a random market
      const marketIds = await redis.smembers('markets');
      if (marketIds.length > 0) {
        const randomId = marketIds[Math.floor(Math.random() * marketIds.length)];
        market = await redis.hgetall(`market:${randomId}`) as unknown as Market;
      }
    }
    
    // If no market found, show default image
    if (!market) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: '#0f172a',
              color: 'white',
              padding: '40px',
              fontFamily: 'sans-serif',
            }}
          >
            <h1 style={{ fontSize: '48px', textAlign: 'center', margin: '0 0 20px' }}>
              Whisper Network Prediction Market
            </h1>
            <p style={{ fontSize: '24px', textAlign: 'center' }}>
              Anonymous prediction markets on Base
            </p>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }
    
    // Calculate current probabilities
    const totalYesAmount = BigInt(market.totalYesAmount || '0');
    const totalNoAmount = BigInt(market.totalNoAmount || '0');
    const totalAmount = totalYesAmount + totalNoAmount;
    
    let yesPercentage = 50;
    let noPercentage = 50;
    
    if (totalAmount > 0) {
      yesPercentage = Number((totalYesAmount * BigInt(100)) / totalAmount);
      noPercentage = 100 - yesPercentage;
    }
    
    // Format amounts for display
    const formatAmount = (amount: bigint) => {
      if (amount < BigInt(1000000000)) {
        return (Number(amount) / 1e18).toFixed(2) + ' ETH';
      } else {
        return (Number(amount) / 1e27).toFixed(2) + 'B ETH';
      }
    };
    
    // Generate image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            color: 'white',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px',
            fontSize: '24px',
            opacity: 0.8,
          }}>
            Whisper Network Prediction Market
          </div>
          
          <h1 style={{ 
            fontSize: '48px', 
            textAlign: 'center', 
            margin: '0 0 40px',
            maxWidth: '900px',
          }}>
            {market.question}
          </h1>
          
          <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: '800px',
            height: '60px',
            marginBottom: '30px',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${yesPercentage}%`,
              height: '100%',
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '24px',
            }}>
              {yesPercentage}%
            </div>
            <div style={{
              width: `${noPercentage}%`,
              height: '100%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '24px',
            }}>
              {noPercentage}%
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '800px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>Yes Pool</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {formatAmount(totalYesAmount)}
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>No Pool</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {formatAmount(totalNoAmount)}
              </div>
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            fontSize: '18px',
            opacity: 0.7,
          }}>
            Expires: {new Date(market.expiresAt).toLocaleDateString()}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            color: 'white',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <h1 style={{ fontSize: '48px', textAlign: 'center', margin: '0 0 20px' }}>
            Whisper Network Prediction Market
          </h1>
          <p style={{ fontSize: '24px', textAlign: 'center' }}>
            Anonymous prediction markets on Base
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

