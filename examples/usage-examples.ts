/**
 * Usage examples for HiroPick services
 * Demonstrates how to use @stacks/connect and @stacks/transactions
 */

import { createTransactionService } from "../services/transaction.service.js";
import { createClientService } from "../services/client.service.js";
import { defaultContractConfig } from "../config/contract.config.js";

/**
 * Example 1: Using transaction service (server-side or with private key)
 * This is useful for backend services or automated scripts
 */
export async function exampleTransactionService() {
  // Initialize transaction service
  const txService = createTransactionService({
    network: "testnet",
    contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  });

  // Example: Create a market
  // Note: In production, never expose private keys in client-side code
  const privateKey = process.env.PRIVATE_KEY || "";
  
  try {
    const tx = await txService.buildCreateMarketTransaction(
      "Will Bitcoin reach $100k by end of 2024?",
      "Cryptocurrency",
      100000, // end block
      {
        senderKey: privateKey,
      }
    );

    // Broadcast the transaction
    const result = await txService.broadcastTransaction(tx);
    console.log("Transaction broadcasted:", result);
  } catch (error) {
    console.error("Error creating market:", error);
  }
}

/**
 * Example 2: Using client service (browser/client-side)
 * This uses @stacks/connect for wallet authentication
 */
export async function exampleClientService() {
  // Initialize client service
  const clientService = createClientService({
    network: "testnet",
    contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  });

  // Connect wallet
  await clientService.connectWallet();

  // Check if authenticated
  if (clientService.isAuthenticated()) {
    const userAddress = clientService.getUserAddress();
    console.log("User address:", userAddress);

    // Example: Create a market
    await clientService.createMarket(
      "Will Ethereum 2.0 launch in 2024?",
      "Blockchain",
      100000,
      (data) => {
        console.log("Market created! TX ID:", data.txId);
      },
      () => {
        console.log("User cancelled");
      }
    );

    // Example: Place a bet
    await clientService.placeBet(
      0, // market ID
      true, // outcome (yes)
      BigInt(1000000), // amount in microSTX (1 STX)
      (data) => {
        console.log("Bet placed! TX ID:", data.txId);
      }
    );

    // Example: Resolve a market (only creator can do this)
    await clientService.resolveMarket(
      0, // market ID
      true, // winning outcome
      (data) => {
        console.log("Market resolved! TX ID:", data.txId);
      }
    );

    // Example: Claim winnings
    await clientService.claimWinnings(
      0, // market ID
      (data) => {
        console.log("Winnings claimed! TX ID:", data.txId);
      }
    );
  }
}

/**
 * Example 3: React component integration
 */
export function ReactExample() {
  /*
  import { useEffect, useState } from 'react';
  import { createClientService } from '../services/client.service';

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
      "Will AI replace developers by 2025?",
      "Technology",
      100000,
      (data) => {
        console.log("Market created:", data.txId);
        // Refresh UI or show success message
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
  */
}

/**
 * Example 4: Backend service using transaction service
 */
export async function exampleBackendService() {
  const txService = createTransactionService({
    network: "testnet",
  });

  // This would typically be called from an API endpoint
  // The private key would be stored securely (e.g., in environment variables)
  const privateKey = process.env.SERVICE_PRIVATE_KEY || "";

  // Create market on behalf of a service account
  const tx = await txService.buildCreateMarketTransaction(
    "Service-created market",
    "Service",
    100000,
    { senderKey: privateKey }
  );

  const result = await txService.broadcastTransaction(tx);
  return result;
}
