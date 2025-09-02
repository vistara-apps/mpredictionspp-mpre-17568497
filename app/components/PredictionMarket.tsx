'use client';

import { useState } from 'react';
import { Transaction, TransactionButton } from '@coinbase/onchainkit/transaction';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';
import { parseEther } from 'viem';

// Mock contract ABI and address (replace with real prediction market contract)
const PREDICTION_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Placeholder
const PREDICTION_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcome', type: 'bool' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'bet',
    outputs: [],
    type: 'function',
    stateMutability: 'payable',
  },
] as const;

type Market = {
  id: number;
  question: string;
};

const mockMarkets: Market[] = [
  { id: 1, question: 'Will the price of ETH exceed $5000 by end of 2024?' },
  { id: 2, question: 'Will Base become the top L2 by TVL in 2025?' },
];

export default function PredictionMarket() {
  const { address } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<boolean | null>(null);

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Available Markets</h2>
      {mockMarkets.map((market) => (
        <div key={market.id} className="bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-lg mb-2">{market.question}</p>
          <div className="flex justify-between">
            <Transaction
              chainId={base.id}
              contracts={[
                {
                  address: PREDICTION_CONTRACT_ADDRESS,
                  abi: PREDICTION_ABI,
                  functionName: 'bet',
                  args: [BigInt(market.id), true, parseEther('0.01')],
                },
              ]}
              capabilities={{ paymasterService: { url: 'https://paymaster.base.org' } }}
            >
              <TransactionButton text="Bet Yes (0.01 ETH)" />
            </Transaction>
            <Transaction
              chainId={base.id}
              contracts={[
                {
                  address: PREDICTION_CONTRACT_ADDRESS,
                  abi: PREDICTION_ABI,
                  functionName: 'bet',
                  args: [BigInt(market.id), false, parseEther('0.01')],
                },
              ]}
              capabilities={{ paymasterService: { url: 'https://paymaster.base.org' } }}
            >
              <TransactionButton text="Bet No (0.01 ETH)" />
            </Transaction>
          </div>
        </div>
      ))}
    </div>
  );
}
  