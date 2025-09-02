'use client';

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import PredictionMarket from './components/PredictionMarket';

export default function Home() {
  const { address } = useAccount();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <h1 className="text-4xl font-bold mb-8 text-center">Whisper Network Prediction Market</h1>
      <div className="mb-8">
        <Wallet>
          <ConnectWallet />
        </Wallet>
      </div>
      {address ? (
        <PredictionMarket />
      ) : (
        <p className="text-xl">Connect your wallet to participate in prediction markets.</p>
      )}
    </main>
  );
}
  