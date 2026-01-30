# HiroPick Integration Guide

This guide explains how to use `@stacks/connect` and `@stacks/transactions` in the HiroPick project.

## Overview

The integration provides two main services:

1. **Transaction Service** (`services/transaction.service.ts`) - For server-side or automated transactions using private keys
2. **Client Service** (`services/client.service.ts`) - For client-side wallet interactions using Stacks Connect

## Installation

The required packages are already installed:
- `@stacks/connect` - For wallet authentication and transaction signing
- `@stacks/transactions` - For building and broadcasting transactions

## Configuration

Configure your contract address and network in `config/contract.config.ts`:

```typescript
export const defaultContractConfig: ContractConfig = {
  contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  contractName: "heropick",
  network: "testnet", // or "mainnet"
};
```

Or set environment variables:
- `CONTRACT_ADDRESS` - Your contract address
- `NETWORK` - Network type (mainnet/testnet/devnet)

## Usage

### Client-Side (Browser) - Using @stacks/connect

For frontend applications where users interact with their wallets:

```typescript
import { createClientService } from "./services/client.service";

// Initialize service
const clientService = createClientService({
  network: "testnet",
  contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
});

// Connect wallet
await clientService.connectWallet();

// Check authentication
if (clientService.isAuthenticated()) {
  const userAddress = clientService.getUserAddress();
  
  // Create a market
  await clientService.createMarket(
    "Will Bitcoin reach $100k?",
    "Cryptocurrency",
    100000, // end block
    (data) => console.log("TX ID:", data.txId)
  );
  
  // Place a bet
  await clientService.placeBet(
    0, // market ID
    true, // outcome (yes)
    BigInt(1000000), // 1 STX in microSTX
    (data) => console.log("TX ID:", data.txId)
  );
  
  // Resolve market (only creator)
  await clientService.resolveMarket(
    0, // market ID
    true, // winning outcome
    (data) => console.log("TX ID:", data.txId)
  );
  
  // Claim winnings
  await clientService.claimWinnings(
    0, // market ID
    (data) => console.log("TX ID:", data.txId)
  );
}
```

### Server-Side - Using @stacks/transactions

For backend services or automated scripts:

```typescript
import { createTransactionService } from "./services/transaction.service";

// Initialize service
const txService = createTransactionService({
  network: "testnet",
  contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
});

// Private key (store securely, never expose in client code!)
const privateKey = process.env.PRIVATE_KEY || "";

// Build and broadcast transaction
const tx = await txService.buildCreateMarketTransaction(
  "Will Ethereum 2.0 launch?",
  "Blockchain",
  100000,
  { senderKey: privateKey }
);

const result = await txService.broadcastTransaction(tx);
console.log("Transaction result:", result);
```

## Available Methods

### Client Service Methods

- `connectWallet()` - Connect user's Stacks wallet
- `isAuthenticated()` - Check if user is authenticated
- `getUserAddress()` - Get user's Stacks address
- `signOut()` - Sign out user
- `createMarket(description, category, endBlock, onFinish, onCancel)` - Create a new market
- `placeBet(marketId, outcome, amount, onFinish, onCancel)` - Place a bet
- `resolveMarket(marketId, winningOutcome, onFinish, onCancel)` - Resolve a market
- `claimWinnings(marketId, onFinish, onCancel)` - Claim winnings

### Transaction Service Methods

- `buildCreateMarketTransaction(description, category, endBlock, options)` - Build create market TX
- `buildPlaceBetTransaction(marketId, outcome, amount, options)` - Build place bet TX
- `buildResolveMarketTransaction(marketId, winningOutcome, options)` - Build resolve market TX
- `buildClaimWinningsTransaction(marketId, options)` - Build claim winnings TX
- `broadcastTransaction(transaction)` - Broadcast transaction to network

## React Integration Example

```typescript
import { useEffect, useState } from 'react';
import { createClientService } from './services/client.service';

function HiroPickApp() {
  const [clientService] = useState(() => createClientService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | undefined>();

  useEffect(() => {
    setIsAuthenticated(clientService.isAuthenticated());
    setUserAddress(clientService.getUserAddress());
  }, []);

  const handleConnect = async () => {
    await clientService.connectWallet();
    setIsAuthenticated(clientService.isAuthenticated());
    setUserAddress(clientService.getUserAddress());
  };

  const handleCreateMarket = async () => {
    await clientService.createMarket(
      "Will AI replace developers?",
      "Technology",
      100000,
      (data) => {
        alert(`Market created! TX: ${data.txId}`);
      }
    );
  };

  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {userAddress}</p>
          <button onClick={handleCreateMarket}>Create Market</button>
        </div>
      )}
    </div>
  );
}
```

## Security Considerations

1. **Never expose private keys** in client-side code
2. **Use environment variables** for sensitive configuration
3. **Validate user input** before building transactions
4. **Handle errors gracefully** in production code
5. **Use HTTPS** in production for wallet connections

## Network Configuration

The service supports three networks:

- **testnet** - Stacks testnet (default)
- **mainnet** - Stacks mainnet
- **devnet** - Local development network

Configure via the `network` parameter when creating service instances.

## Examples

See `examples/usage-examples.ts` for more detailed usage examples.

## Troubleshooting

### Wallet Connection Issues

- Ensure you're using the correct network (testnet/mainnet)
- Check that the Stacks wallet extension is installed
- Verify the contract address is correct

### Transaction Errors

- Check that you have sufficient STX for fees
- Verify the contract is deployed on the network
- Ensure function arguments match the contract interface
- Check nonce values if transactions are failing

### Import Errors

- Ensure all packages are installed: `npm install`
- Check TypeScript configuration in `tsconfig.json`
- Verify module resolution settings
