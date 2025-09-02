# Whisper Network Prediction Market

A decentralized prediction market platform built on Base that allows users to create and participate in markets with varying levels of privacy.

## Overview

Whisper Network Prediction Market is a Base Mini App that enables users to:

- Create prediction markets with different visibility levels (public, private, or whisper/anonymous)
- Bet on binary outcomes (Yes/No) using ETH
- Resolve markets and distribute winnings
- Share markets via Farcaster Frames
- Participate in gasless transactions with Base Account Abstraction

## Technical Architecture

### Frontend

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Wallet Integration**: OnchainKit
- **State Management**: React Query

### Backend

- **API Routes**: Next.js API Routes
- **Database**: Upstash Redis
- **Blockchain Integration**: Viem, Wagmi
- **Social Integration**: Farcaster Frames

### Smart Contracts

- **Network**: Base (Ethereum L2)
- **Features**:
  - Market creation and management
  - Betting mechanism
  - Resolution and payout system
  - Access control for private markets

## API Documentation

### Markets API

#### GET /api/markets

Retrieves all markets or filtered by query parameters.

**Query Parameters:**
- `category` (string): Filter by market category
- `visibility` (string): Filter by visibility level ('public', 'private', 'whisper')
- `creator` (string): Filter by creator address
- `resolved` (boolean): Filter by resolution status
- `tag` (string): Filter by tag

**Response:**
```json
{
  "markets": [
    {
      "id": "string",
      "question": "string",
      "description": "string",
      "creator": "string",
      "createdAt": "number",
      "expiresAt": "number",
      "totalYesAmount": "string",
      "totalNoAmount": "string",
      "resolved": "boolean",
      "outcome": "boolean",
      "category": "string",
      "tags": ["string"],
      "visibility": "string",
      "accessList": ["string"]
    }
  ]
}
```

#### POST /api/markets

Creates a new prediction market.

**Request Body:**
```json
{
  "question": "string",
  "description": "string",
  "creator": "string",
  "expiresAt": "number",
  "category": "string",
  "tags": ["string"],
  "visibility": "string",
  "accessList": ["string"]
}
```

**Response:**
```json
{
  "market": {
    "id": "string",
    "question": "string",
    "description": "string",
    "creator": "string",
    "createdAt": "number",
    "expiresAt": "number",
    "totalYesAmount": "string",
    "totalNoAmount": "string",
    "resolved": "boolean",
    "category": "string",
    "tags": ["string"],
    "visibility": "string",
    "accessList": ["string"]
  }
}
```

#### GET /api/markets/[id]

Retrieves a specific market by ID.

**Response:**
```json
{
  "market": {
    "id": "string",
    "question": "string",
    "description": "string",
    "creator": "string",
    "createdAt": "number",
    "expiresAt": "number",
    "totalYesAmount": "string",
    "totalNoAmount": "string",
    "resolved": "boolean",
    "outcome": "boolean",
    "category": "string",
    "tags": ["string"],
    "visibility": "string",
    "accessList": ["string"]
  },
  "bets": [
    {
      "marketId": "string",
      "bettor": "string",
      "outcome": "boolean",
      "amount": "string",
      "timestamp": "number"
    }
  ]
}
```

#### PUT /api/markets/[id]

Updates a market (for resolving outcomes).

**Request Body:**
```json
{
  "resolved": "boolean",
  "outcome": "boolean"
}
```

**Response:**
```json
{
  "market": {
    "id": "string",
    "question": "string",
    "description": "string",
    "creator": "string",
    "createdAt": "number",
    "expiresAt": "number",
    "totalYesAmount": "string",
    "totalNoAmount": "string",
    "resolved": "boolean",
    "outcome": "boolean",
    "category": "string",
    "tags": ["string"],
    "visibility": "string",
    "accessList": ["string"]
  }
}
```

### Bets API

#### GET /api/bets

Retrieves bets filtered by query parameters.

**Query Parameters:**
- `marketId` (string): Filter by market ID
- `bettor` (string): Filter by bettor address

**Response:**
```json
{
  "bets": [
    {
      "marketId": "string",
      "bettor": "string",
      "outcome": "boolean",
      "amount": "string",
      "timestamp": "number"
    }
  ]
}
```

#### POST /api/bets

Places a new bet on a market.

**Request Body:**
```json
{
  "marketId": "string",
  "bettor": "string",
  "outcome": "boolean",
  "amount": "string"
}
```

**Response:**
```json
{
  "bet": {
    "marketId": "string",
    "bettor": "string",
    "outcome": "boolean",
    "amount": "string",
    "timestamp": "number"
  }
}
```

### Farcaster Frame API

#### GET /api/frame

Serves the initial frame for Farcaster.

#### POST /api/frame

Handles frame interactions.

### Open Graph API

#### GET /api/og

Generates Open Graph images for markets.

**Query Parameters:**
- `marketId` (string): ID of the market to generate an image for

## Smart Contract Interface

### PredictionMarket Contract

**Functions:**

- `bet(uint256 marketId, bool outcome)` - Place a bet on a market
- `createMarket(string question, string description, uint256 expiresAt, string category, uint8 visibility, address[] accessList)` - Create a new market
- `resolveMarket(uint256 marketId, bool outcome)` - Resolve a market with the final outcome
- `claimWinnings(uint256 marketId)` - Claim winnings from a resolved market
- `getMarket(uint256 marketId)` - Get market details
- `getMarkets()` - Get all market IDs

## UI/UX Requirements

### User Flows

1. **Market Creation Flow**
   - Connect wallet
   - Fill out market creation form
   - Submit transaction
   - View created market

2. **Betting Flow**
   - Browse available markets
   - Select a market
   - Choose outcome (Yes/No)
   - Enter bet amount
   - Submit transaction
   - View updated market odds

3. **Market Resolution Flow**
   - Market creator views expired market
   - Selects final outcome
   - Submits resolution transaction
   - Users claim winnings

### Design System

- **Color Palette**:
  - Primary: Blue (#3b82f6)
  - Success: Green (#22c55e)
  - Danger: Red (#ef4444)
  - Background: Dark Gray (#111827)
  - Surface: Gray (#1f2937)
  - Text: White (#ffffff)

- **Typography**:
  - Headings: Inter, Bold
  - Body: Inter, Regular
  - Monospace: For addresses and technical data

- **Components**:
  - Buttons
  - Cards
  - Progress bars
  - Form inputs
  - Modals
  - Notifications

## Deployment

### Environment Variables

```
NEXT_PUBLIC_BASE_URL=https://mpredictionspp.vistara.dev
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your-onchainkit-api-key
NEYNAR_API_KEY=your-neynar-api-key
PREDICTION_CONTRACT_ADDRESS=your-contract-address
```

### Deployment Steps

1. Set up environment variables
2. Build the application: `npm run build`
3. Deploy to Vercel or similar platform
4. Configure custom domain
5. Set up Farcaster Frame verification

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Base testnet account with ETH

### Installation

```bash
# Clone the repository
git clone https://github.com/vistara-apps/mpredictionspp-mpre-17568497.git

# Install dependencies
cd mpredictionspp-mpre-17568497
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint
```

## License

MIT

