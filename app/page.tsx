'use client';

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import PredictionMarket from './components/PredictionMarket';
import Link from 'next/link';

export default function Home() {
  const { address } = useAccount();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Whisper Network Prediction Market</h1>
          <Wallet>
            <ConnectWallet />
          </Wallet>
        </div>
        
        {address ? (
          <PredictionMarket />
        ) : (
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-xl mb-6">Connect your wallet to participate in prediction markets.</p>
            <p className="mb-6">Create and bet on anonymous prediction markets using the Base blockchain.</p>
            <div className="flex justify-center space-x-4">
              <Wallet>
                <ConnectWallet />
              </Wallet>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">About Whisper Network Prediction Markets</h2>
          <p className="mb-4">
            Whisper Network is a decentralized prediction market platform built on Base that allows users to create and participate in markets with varying levels of privacy.
          </p>
          <p className="mb-4">
            <strong>Key Features:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Create public, private, or whisper (anonymous) prediction markets</li>
            <li>Bet on binary outcomes (Yes/No) with ETH</li>
            <li>Automatic market resolution and winnings distribution</li>
            <li>Integration with Farcaster for social sharing</li>
            <li>Gasless transactions with Base Account Abstraction</li>
          </ul>
          <p>
            Built with Next.js, Tailwind CSS, and OnchainKit for seamless blockchain integration.
          </p>
        </div>
      </div>
    </main>
  );
}

