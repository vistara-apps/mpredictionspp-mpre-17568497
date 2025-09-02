'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionButton } from '@coinbase/onchainkit/transaction';
import { useAccount } from 'wagmi';
import { createBetTransaction, createMarketTransaction } from '../lib/contracts';
import { getMarkets, getMarket, placeBet } from '../lib/api';
import { Market, Bet } from '../api/markets/route';

// Market visibility options
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private (Selected Addresses)' },
  { value: 'whisper', label: 'Whisper Network (Anonymous)' },
];

// Market categories
const CATEGORIES = [
  'Crypto',
  'Politics',
  'Sports',
  'Entertainment',
  'Technology',
  'Science',
  'Economy',
  'Other',
];

export default function PredictionMarket() {
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [marketDetails, setMarketDetails] = useState<{ market: Market; bets: Bet[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states for creating a new market
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    expiresAt: '',
    category: CATEGORIES[0],
    visibility: 'public' as 'public' | 'private' | 'whisper',
    accessList: '',
    tags: '',
  });
  
  // Bet amount state
  const [betAmount, setBetAmount] = useState('0.01');
  
  // Load markets on component mount
  useEffect(() => {
    async function loadMarkets() {
      try {
        setIsLoading(true);
        const marketsData = await getMarkets();
        setMarkets(marketsData);
        setError(null);
      } catch (err) {
        console.error('Failed to load markets:', err);
        setError('Failed to load markets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMarkets();
  }, []);
  
  // Load market details when a market is selected
  useEffect(() => {
    if (!selectedMarket) {
      setMarketDetails(null);
      return;
    }
    
    async function loadMarketDetails() {
      try {
        setIsLoading(true);
        const details = await getMarket(selectedMarket);
        setMarketDetails(details);
        setError(null);
      } catch (err) {
        console.error('Failed to load market details:', err);
        setError('Failed to load market details. Please try again later.');
        setMarketDetails(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMarketDetails();
  }, [selectedMarket]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle market creation form submission
  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert form data to the format expected by the API
    const expiresAt = new Date(formData.expiresAt).getTime();
    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    const accessList = formData.accessList.split(',').map(addr => addr.trim()).filter(Boolean);
    
    // Map visibility to numeric value for the contract
    const visibilityValue = 
      formData.visibility === 'public' ? 0 : 
      formData.visibility === 'private' ? 1 : 2;
    
    // Create transaction object
    const transaction = createMarketTransaction(
      formData.question,
      formData.description,
      expiresAt,
      formData.category,
      visibilityValue,
      accessList
    );
    
    // Reset form after submission
    setShowCreateForm(false);
  };
  
  // Calculate probabilities for a market
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
  
  // Render loading state
  if (isLoading && !markets.length) {
    return (
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 p-6 rounded-lg">
          <p className="text-center">Loading prediction markets...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !markets.length) {
    return (
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 p-6 rounded-lg">
          <p className="text-red-500 text-center">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg mx-auto block"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Render market creation form
  if (showCreateForm) {
    return (
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Create New Prediction Market</h2>
          
          <form onSubmit={handleCreateMarket} className="space-y-4">
            <div>
              <label className="block mb-1">Question</label>
              <input
                type="text"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                required
                className="w-full p-2 bg-gray-700 rounded-lg"
                placeholder="Will ETH reach $10,000 in 2024?"
              />
            </div>
            
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full p-2 bg-gray-700 rounded-lg"
                rows={3}
                placeholder="Provide details about this prediction market..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Expiration Date</label>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 rounded-lg"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 rounded-lg"
                placeholder="ethereum, defi, price"
              />
            </div>
            
            <div>
              <label className="block mb-1">Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                required
                className="w-full p-2 bg-gray-700 rounded-lg"
              >
                {VISIBILITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {formData.visibility === 'private' && (
              <div>
                <label className="block mb-1">Access List (comma-separated addresses)</label>
                <input
                  type="text"
                  name="accessList"
                  value={formData.accessList}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 rounded-lg"
                  placeholder="0x1234..., 0xabcd..."
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              
              <Transaction
                chainId={createMarketTransaction('', '', 0, '', 0, []).chainId}
                contracts={createMarketTransaction(
                  formData.question,
                  formData.description,
                  new Date(formData.expiresAt).getTime(),
                  formData.category,
                  formData.visibility === 'public' ? 0 : formData.visibility === 'private' ? 1 : 2,
                  formData.accessList.split(',').map(addr => addr.trim()).filter(Boolean)
                ).contracts}
                capabilities={createMarketTransaction('', '', 0, '', 0, []).capabilities}
              >
                <TransactionButton text="Create Market" className="px-4 py-2 bg-blue-600 rounded-lg" />
              </Transaction>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // Render market details if a market is selected
  if (selectedMarket && marketDetails) {
    const { market, bets } = marketDetails;
    const { yesPercentage, noPercentage } = calculateProbabilities(market);
    
    return (
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{market.question}</h2>
            <button
              onClick={() => setSelectedMarket(null)}
              className="px-3 py-1 bg-gray-700 rounded-lg text-sm"
            >
              Back to Markets
            </button>
          </div>
          
          <p className="mb-4">{market.description}</p>
          
          <div className="mb-6">
            <div className="flex w-full h-8 mb-2 rounded-lg overflow-hidden">
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
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-400">Yes Pool</p>
                <p className="text-xl font-semibold">{(Number(market.totalYesAmount) / 1e18).toFixed(4)} ETH</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-400">No Pool</p>
                <p className="text-xl font-semibold">{(Number(market.totalNoAmount) / 1e18).toFixed(4)} ETH</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Created By</p>
              <p className="font-mono text-sm truncate">{market.creator}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Expires</p>
              <p>{formatDate(market.expiresAt)}</p>
            </div>
          </div>
          
          {!market.resolved && (
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
                  {...createBetTransaction(Number(market.id), true, betAmount)}
                >
                  <TransactionButton 
                    text={`Bet Yes (${betAmount} ETH)`}
                    className="px-4 py-2 bg-green-600 rounded-lg flex-1"
                  />
                </Transaction>
                
                <Transaction
                  {...createBetTransaction(Number(market.id), false, betAmount)}
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
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-semibold mb-3">Recent Bets</h3>
            
            {bets.length === 0 ? (
              <p className="text-gray-400">No bets placed yet.</p>
            ) : (
              <div className="space-y-2">
                {bets.slice(0, 5).map((bet, index) => (
                  <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between">
                    <div>
                      <span className="font-mono text-sm truncate">{bet.bettor.substring(0, 8)}...</span>
                      <span className={`ml-2 ${bet.outcome ? 'text-green-500' : 'text-red-500'}`}>
                        {bet.outcome ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="font-semibold">{(Number(bet.amount) / 1e18).toFixed(4)} ETH</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render markets list
  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Available Markets</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 rounded-lg"
        >
          Create Market
        </button>
      </div>
      
      {markets.length === 0 ? (
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <p className="mb-4">No prediction markets available yet.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            Create the First Market
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {markets.map((market) => {
            const { yesPercentage, noPercentage } = calculateProbabilities(market);
            
            return (
              <div key={market.id} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{market.question}</h3>
                
                <div className="flex w-full h-6 mb-2 rounded-lg overflow-hidden">
                  <div 
                    className="bg-green-600 flex items-center justify-center text-xs font-medium"
                    style={{ width: `${yesPercentage}%` }}
                  >
                    {yesPercentage}%
                  </div>
                  <div 
                    className="bg-red-600 flex items-center justify-center text-xs font-medium"
                    style={{ width: `${noPercentage}%` }}
                  >
                    {noPercentage}%
                  </div>
                </div>
                
                <div className="flex justify-between text-sm mb-3">
                  <div>Yes: {(Number(market.totalYesAmount) / 1e18).toFixed(4)} ETH</div>
                  <div>No: {(Number(market.totalNoAmount) / 1e18).toFixed(4)} ETH</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Expires: {formatDate(market.expiresAt)}
                  </div>
                  
                  <button
                    onClick={() => setSelectedMarket(market.id)}
                    className="px-3 py-1 bg-blue-600 rounded-lg text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

