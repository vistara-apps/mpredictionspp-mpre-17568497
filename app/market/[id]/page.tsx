'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { Transaction, TransactionButton } from '@coinbase/onchainkit/transaction';
import { getMarket } from '../../lib/api';
import { createBetTransaction, createResolveMarketTransaction, createClaimWinningsTransaction } from '../../lib/contracts';
import { Market, Bet } from '../../api/markets/route';

export default function MarketPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  
  const [marketDetails, setMarketDetails] = useState<{ market: Market; bets: Bet[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('0.01');
  
  // Check if there's a prefilled action from Farcaster Frame
  const action = searchParams.get('action');
  const outcome = searchParams.get('outcome');
  
  useEffect(() => {
    if (action === 'bet' && outcome) {
      setBetAmount('0.01'); // Default amount
    }
  }, [action, outcome]);
  
  // Load market details
  useEffect(() => {
    async function loadMarketDetails() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const marketId = Array.isArray(id) ? id[0] : id;
        const details = await getMarket(marketId);
        setMarketDetails(details);
        setError(null);
      } catch (err) {
        console.error('Failed to load market details:', err);
        setError('Failed to load market details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMarketDetails();
  }, [id]);
  
  // Calculate probabilities
  const calculateProbabilities = (market: Market) => {
    const totalYesAmount = BigInt(market.totalYesAmount || '0');
    const totalNoAmount = BigInt(market.totalNoAmount || '0');
    const totalAmount = totalYesAmount + totalNoAmount;
    
    let yesPercentage = 50;
    let noPercentage = 50;
    
    if (totalAmount > 0) {
      yesPercentage = Number((totalYesAmount * BigInt(100)) / totalAmount);
      noPercentage = 100 - yesPercentage;
    }
    
    return { yesPercentage, noPercentage };
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Check if user has placed a bet
  const userHasBet = (bets: Bet[]) => {
    if (!address) return false;
    return bets.some(bet => bet.bettor.toLowerCase() === address.toLowerCase());
  };
  
  // Check if user is the market creator
  const isMarketCreator = (market: Market) => {
    if (!address) return false;
    return market.creator.toLowerCase() === address.toLowerCase();
  };
  
  // Check if user has winning bets
  const userHasWinningBets = (market: Market, bets: Bet[]) => {
    if (!address || !market.resolved) return false;
    return bets.some(
      bet => 
        bet.bettor.toLowerCase() === address.toLowerCase() && 
        bet.outcome === market.outcome
    );
  };
  
  if (!address) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Whisper Network Prediction Market</h1>
          <div className="mb-8 text-center">
            <Wallet>
              <ConnectWallet />
            </Wallet>
          </div>
          <p className="text-xl text-center">Connect your wallet to view this prediction market.</p>
        </div>
      </main>
    );
  }
  
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Whisper Network Prediction Market</h1>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-center">Loading market details...</p>
          </div>
        </div>
      </main>
    );
  }
  
  if (error || !marketDetails) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Whisper Network Prediction Market</h1>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-red-500 text-center">{error || 'Market not found'}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 rounded-lg mx-auto block"
              onClick={() => window.location.href = '/'}
            >
              Back to Markets
            </button>
          </div>
        </div>
      </main>
    );
  }
  
  const { market, bets } = marketDetails;
  const { yesPercentage, noPercentage } = calculateProbabilities(market);
  const marketId = Array.isArray(id) ? id[0] : id;
  
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Prediction Market</h1>
          <Wallet>
            <ConnectWallet />
          </Wallet>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-semibold">{market.question}</h2>
            <button
              onClick={() => window.location.href = '/'}
              className="px-3 py-1 bg-gray-700 rounded-lg text-sm"
            >
              Back to Markets
            </button>
          </div>
          
          <p className="mb-6">{market.description}</p>
          
          <div className="mb-6">
            <div className="flex w-full h-10 mb-2 rounded-lg overflow-hidden">
              <div 
                className="bg-green-600 flex items-center justify-center font-medium"
                style={{ width: `${yesPercentage}%` }}
              >
                {yesPercentage}% Yes
              </div>
              <div 
                className="bg-red-600 flex items-center justify-center font-medium"
                style={{ width: `${noPercentage}%` }}
              >
                {noPercentage}% No
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Yes Pool</p>
                <p className="text-xl font-semibold">{(Number(market.totalYesAmount) / 1e18).toFixed(4)} ETH</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">No Pool</p>
                <p className="text-xl font-semibold">{(Number(market.totalNoAmount) / 1e18).toFixed(4)} ETH</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Created By</p>
              <p className="font-mono text-sm truncate">{market.creator}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Created</p>
              <p>{formatDate(market.createdAt)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Expires</p>
              <p>{formatDate(market.expiresAt)}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="bg-blue-900 px-3 py-1 rounded-full text-sm">
              {market.category}
            </div>
            {market.tags && market.tags.map((tag, index) => (
              <div key={index} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                {tag}
              </div>
            ))}
            <div className={`px-3 py-1 rounded-full text-sm ${
              market.visibility === 'public' 
                ? 'bg-green-900' 
                : market.visibility === 'private' 
                  ? 'bg-yellow-900' 
                  : 'bg-purple-900'
            }`}>
              {market.visibility.charAt(0).toUpperCase() + market.visibility.slice(1)}
            </div>
          </div>
          
          {!market.resolved && new Date(market.expiresAt) > new Date() && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Place Your Bet</h3>
              
              <div className="flex items-center mb-4">
                <label className="mr-3">Amount (ETH):</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="0.001"
                  step="0.001"
                  className="w-24 p-2 bg-gray-700 rounded-lg"
                />
              </div>
              
              <div className="flex space-x-4">
                <Transaction
                  {...createBetTransaction(Number(marketId), true, betAmount)}
                >
                  <TransactionButton 
                    text={`Bet Yes (${betAmount} ETH)`}
                    className="px-4 py-2 bg-green-600 rounded-lg flex-1"
                  />
                </Transaction>
                
                <Transaction
                  {...createBetTransaction(Number(marketId), false, betAmount)}
                >
                  <TransactionButton 
                    text={`Bet No (${betAmount} ETH)`}
                    className="px-4 py-2 bg-red-600 rounded-lg flex-1"
                  />
                </Transaction>
              </div>
            </div>
          )}
          
          {market.resolved && (
            <div className="mb-6 bg-blue-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Market Resolved</h3>
              <p className="text-lg">
                Outcome: <span className="font-bold">{market.outcome ? 'Yes' : 'No'}</span>
              </p>
              
              {userHasWinningBets(market, bets) && (
                <div className="mt-4">
                  <Transaction
                    {...createClaimWinningsTransaction(Number(marketId))}
                  >
                    <TransactionButton 
                      text="Claim Winnings"
                      className="px-4 py-2 bg-green-600 rounded-lg"
                    />
                  </Transaction>
                </div>
              )}
            </div>
          )}
          
          {!market.resolved && new Date(market.expiresAt) < new Date() && isMarketCreator(market) && (
            <div className="mb-6 bg-yellow-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Market Expired</h3>
              <p className="mb-4">As the creator, you can resolve this market with the final outcome.</p>
              
              <div className="flex space-x-4">
                <Transaction
                  {...createResolveMarketTransaction(Number(marketId), true)}
                >
                  <TransactionButton 
                    text="Resolve as Yes"
                    className="px-4 py-2 bg-green-600 rounded-lg"
                  />
                </Transaction>
                
                <Transaction
                  {...createResolveMarketTransaction(Number(marketId), false)}
                >
                  <TransactionButton 
                    text="Resolve as No"
                    className="px-4 py-2 bg-red-600 rounded-lg"
                  />
                </Transaction>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">All Bets</h3>
          
          {bets.length === 0 ? (
            <p className="text-gray-400">No bets placed yet.</p>
          ) : (
            <div className="space-y-3">
              {bets.map((bet, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm mb-1">{bet.bettor}</div>
                    <div className="flex items-center">
                      <span className={`${bet.outcome ? 'text-green-500' : 'text-red-500'} font-semibold mr-3`}>
                        {bet.outcome ? 'Yes' : 'No'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(bet.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="font-semibold text-lg">{(Number(bet.amount) / 1e18).toFixed(4)} ETH</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

