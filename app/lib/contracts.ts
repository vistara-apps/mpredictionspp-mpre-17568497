import { base } from 'viem/chains';
import { parseEther } from 'viem';

// Prediction Market Contract ABI
export const PREDICTION_MARKET_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcome', type: 'bool' },
    ],
    name: 'bet',
    outputs: [],
    type: 'function',
    stateMutability: 'payable',
  },
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'category', type: 'string' },
      { name: 'visibility', type: 'uint8' }, // 0 = public, 1 = private, 2 = whisper
      { name: 'accessList', type: 'address[]' },
    ],
    name: 'createMarket',
    outputs: [{ name: 'marketId', type: 'uint256' }],
    type: 'function',
    stateMutability: 'nonpayable',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcome', type: 'bool' },
    ],
    name: 'resolveMarket',
    outputs: [],
    type: 'function',
    stateMutability: 'nonpayable',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'claimWinnings',
    outputs: [],
    type: 'function',
    stateMutability: 'nonpayable',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'getMarket',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'question', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'totalYesAmount', type: 'uint256' },
          { name: 'totalNoAmount', type: 'uint256' },
          { name: 'resolved', type: 'bool' },
          { name: 'outcome', type: 'bool' },
          { name: 'category', type: 'string' },
          { name: 'visibility', type: 'uint8' },
        ],
        name: 'market',
        type: 'tuple',
      },
    ],
    type: 'function',
    stateMutability: 'view',
  },
  {
    inputs: [],
    name: 'getMarkets',
    outputs: [{ name: 'marketIds', type: 'uint256[]' }],
    type: 'function',
    stateMutability: 'view',
  },
] as const;

// Contract address from environment variable
export const PREDICTION_CONTRACT_ADDRESS = process.env.PREDICTION_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';

// Helper function to create a bet transaction
export function createBetTransaction(marketId: number, outcome: boolean, amount: string) {
  return {
    chainId: base.id,
    contracts: [
      {
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'bet',
        args: [BigInt(marketId), outcome],
        value: parseEther(amount),
      },
    ],
    capabilities: { paymasterService: { url: 'https://paymaster.base.org' } },
  };
}

// Helper function to create a market creation transaction
export function createMarketTransaction(
  question: string,
  description: string,
  expiresAt: number,
  category: string,
  visibility: number,
  accessList: string[] = []
) {
  return {
    chainId: base.id,
    contracts: [
      {
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'createMarket',
        args: [question, description, BigInt(expiresAt), category, visibility, accessList],
      },
    ],
    capabilities: { paymasterService: { url: 'https://paymaster.base.org' } },
  };
}

// Helper function to create a market resolution transaction
export function createResolveMarketTransaction(marketId: number, outcome: boolean) {
  return {
    chainId: base.id,
    contracts: [
      {
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'resolveMarket',
        args: [BigInt(marketId), outcome],
      },
    ],
    capabilities: { paymasterService: { url: 'https://paymaster.base.org' } },
  };
}

// Helper function to create a claim winnings transaction
export function createClaimWinningsTransaction(marketId: number) {
  return {
    chainId: base.id,
    contracts: [
      {
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(marketId)],
      },
    ],
    capabilities: { paymasterService: { url: 'https://paymaster.base.org' } },
  };
}

