# HiroPick

A decentralized prediction market built on Stacks blockchain where users can create markets, place bets on future events, and resolve markets with automatic payouts.

## Features

- **Create Markets**: Users can create prediction markets on any future event
- **Place Bets**: Users can bet on market outcomes (yes/no)
- **Resolve Markets**: Market creators can resolve markets after the end date
- **Claim Winnings**: Winners automatically receive proportional payouts
- **Chainhooks Integration**: Real-time event monitoring using `@hirosystems/chainhooks-client`

## Project Structure

```
HiroPick/
├── contracts/
│   └── heropick.clar          # Clarity smart contract
├── services/
│   ├── chainhooks.ts          # Chainhooks client service
│   └── webhook-handler.ts     # Webhook event processor
├── config/
│   └── chainhooks.config.ts  # Chainhooks configuration
├── tests/
│   └── heropick.test.ts       # Contract and integration tests
└── package.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. The `@hirosystems/chainhooks-client` package is already included.

## Clarity Contract

### Core Functions

#### Create Market
```clarity
(create-market 
  description (string-ascii 500)
  category (string-ascii 100)
  end-block uint
)
```
Creates a new prediction market. Returns the market ID.

#### Place Bet
```clarity
(place-bet
  market-id uint
  outcome bool  ;; true = yes, false = no
  amount uint
)
```
Places a bet on a market outcome. Users can only place one bet per market.

#### Resolve Market
```clarity
(resolve-market
  market-id uint
  winning-outcome bool
)
```
Resolves a market (only callable by market creator after end block).

#### Claim Winnings
```clarity
(claim-winnings market-id uint)
```
Claims winnings for a resolved market. Winners receive proportional payouts from the total pool.

### Read-Only Functions

- `get-market (market-id uint)` - Get market information
- `get-bet (bet-id uint)` - Get bet information
- `get-market-stats (market-id uint)` - Get market statistics
- `get-user-bet (market-id uint) (bettor principal)` - Get user's bet for a market
- `get-market-counter` - Get total number of markets
- `get-bet-counter` - Get total number of bets

## Chainhooks Integration

### Setup

1. Configure environment variables:
```bash
export CHAINHOOKS_API_KEY="your-api-key"
export CHAINHOOKS_JWT="your-jwt-token"  # Optional
export CHAINHOOKS_WEBHOOK_URL="https://your-server.com/webhook"
export CHAINHOOKS_BASE_URL="https://api.hiro.so"  # Optional
```

2. Create a chainhooks service instance:
```typescript
import { createChainhooksService } from "./services/chainhooks.js";

const service = createChainhooksService({
  network: "testnet", // or "mainnet"
  apiKey: process.env.CHAINHOOKS_API_KEY,
  jwt: process.env.CHAINHOOKS_JWT,
});
```

3. Register a chainhook for your contract:
```typescript
const contractAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const contractName = "heropick";

const hook = await service.registerPredictionMarketHook(
  contractAddress,
  contractName
);

console.log("Chainhook registered:", hook.id);
```

### Webhook Handler

The webhook handler processes incoming Chainhooks events:

```typescript
import { createWebhookHandler } from "./services/webhook-handler.js";
import { createChainhooksService } from "./services/chainhooks.js";

const service = createChainhooksService({ network: "testnet" });
const handler = createWebhookHandler(service);

// In Express.js:
app.post("/webhook", handler);
```

### Event Types

The service processes the following event types:

- `market_created` - When a new market is created
- `bet_placed` - When a user places a bet
- `market_resolved` - When a market is resolved
- `winnings_claimed` - When winnings are claimed

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:report
```

Watch mode:
```bash
npm run test:watch
```

## Development

### Using Clarinet

Check contracts:
```bash
clarinet check
```

Start local devnet:
```bash
clarinet devnet start
```

### Contract Deployment

1. Configure deployment settings in `settings/Devnet.toml`
2. Deploy using Clarinet:
```bash
clarinet deploy
```

## Usage Examples

### Creating a Market

```typescript
// In your frontend or backend
const marketId = await contract.callPublicFn(
  "heropick",
  "create-market",
  [
    "Will Bitcoin reach $100k by end of 2024?",
    "crypto",
    100000  // end block
  ],
  userAddress
);
```

### Placing a Bet

```typescript
const betId = await contract.callPublicFn(
  "heropick",
  "place-bet",
  [
    marketId,
    true,  // betting on "yes"
    1000000  // 1 STX (in microstacks)
  ],
  userAddress
);
```

### Resolving a Market

```typescript
// Only market creator can resolve
await contract.callPublicFn(
  "heropick",
  "resolve-market",
  [
    marketId,
    true  // winning outcome
  ],
  creatorAddress
);
```

### Claiming Winnings

```typescript
const payout = await contract.callPublicFn(
  "heropick",
  "claim-winnings",
  [marketId],
  winnerAddress
);
```

## Error Codes

- `1001` - Market not found
- `1002` - Market closed
- `1003` - Market already resolved
- `1004` - Invalid outcome
- `1005` - Insufficient balance
- `1006` - Unauthorized
- `1007` - Invalid amount
- `1008` - Market already exists (user already placed bet)

## License

ISC

## Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language](https://docs.stacks.co/docs/clarity)
- [Chainhooks Documentation](https://docs.hiro.so/chainhooks)
- [Clarinet SDK](https://docs.hiro.so/stacks/clarinet-js-sdk)
