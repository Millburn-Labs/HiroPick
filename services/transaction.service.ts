/**
 * Transaction service for HiroPick using @stacks/transactions
 * Handles building and broadcasting contract call transactions
 */

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  StacksNetwork,
  StacksTestnet,
  StacksMainnet,
  getAddressFromPrivateKey,
  TransactionVersion,
  createStacksPrivateKey,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
  boolCV,
  ClarityValue,
  SignedContractCallOptions,
  broadcastTransaction as broadcastTx,
  getNonce,
} from "@stacks/transactions";
import {
  getContractIdentifier,
  getStacksNetwork,
  defaultContractConfig,
  type ContractConfig,
  type Network,
} from "../config/contract.config.js";

/**
 * Transaction service for interacting with HiroPick contract
 */
export class HiroPickTransactionService {
  private contractIdentifier: string;
  private network: StacksNetwork;
  private networkType: Network;

  constructor(config: ContractConfig) {
    this.contractIdentifier = getContractIdentifier(config);
    this.networkType = config.network;
    const networkConfig = getStacksNetwork(config.network);
    
    // Create Stacks network instance
    if (config.network === "mainnet") {
      this.network = new StacksMainnet({ url: networkConfig.url });
    } else if (config.network === "testnet") {
      this.network = new StacksTestnet({ url: networkConfig.url });
    } else {
      // Devnet
      this.network = new StacksTestnet({ url: networkConfig.url });
    }
  }

  /**
   * Build a transaction for creating a market
   */
  async buildCreateMarketTransaction(
    description: string,
    category: string,
    endBlock: number,
    options: {
      senderKey: string;
      fee?: number;
      nonce?: number;
    }
  ) {
    const senderAddress = getAddressFromPrivateKey(
      options.senderKey,
      this.networkType === "mainnet" ? TransactionVersion.Mainnet : TransactionVersion.Testnet
    );

    const nonce = options.nonce ?? (await getNonce(senderAddress, this.network));

    const txOptions: SignedContractCallOptions = {
      contractAddress: this.contractIdentifier.split(".")[0],
      contractName: this.contractIdentifier.split(".")[1],
      functionName: "create-market",
      functionArgs: [
        stringAsciiCV(description),
        stringAsciiCV(category),
        uintCV(endBlock),
      ],
      senderKey: options.senderKey,
      fee: options.fee,
      nonce,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCall(txOptions);
  }

  /**
   * Build a transaction for placing a bet
   */
  async buildPlaceBetTransaction(
    marketId: number,
    outcome: boolean,
    amount: bigint,
    options: {
      senderKey: string;
      fee?: number;
      nonce?: number;
    }
  ) {
    const senderAddress = getAddressFromPrivateKey(
      options.senderKey,
      this.networkType === "mainnet" ? TransactionVersion.Mainnet : TransactionVersion.Testnet
    );

    const nonce = options.nonce ?? (await getNonce(senderAddress, this.network));

    const txOptions: SignedContractCallOptions = {
      contractAddress: this.contractIdentifier.split(".")[0],
      contractName: this.contractIdentifier.split(".")[1],
      functionName: "place-bet",
      functionArgs: [
        uintCV(marketId),
        boolCV(outcome),
        uintCV(amount),
      ],
      senderKey: options.senderKey,
      fee: options.fee,
      nonce,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      // Include STX transfer amount
      amount: amount.toString(),
    };

    return await makeContractCall(txOptions);
  }

  /**
   * Build a transaction for resolving a market
   */
  async buildResolveMarketTransaction(
    marketId: number,
    winningOutcome: boolean,
    options: {
      senderKey: string;
      fee?: number;
      nonce?: number;
    }
  ) {
    const senderAddress = getAddressFromPrivateKey(
      options.senderKey,
      this.networkType === "mainnet" ? TransactionVersion.Mainnet : TransactionVersion.Testnet
    );

    const nonce = options.nonce ?? (await getNonce(senderAddress, this.network));

    const txOptions: SignedContractCallOptions = {
      contractAddress: this.contractIdentifier.split(".")[0],
      contractName: this.contractIdentifier.split(".")[1],
      functionName: "resolve-market",
      functionArgs: [
        uintCV(marketId),
        boolCV(winningOutcome),
      ],
      senderKey: options.senderKey,
      fee: options.fee,
      nonce,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCall(txOptions);
  }

  /**
   * Build a transaction for claiming winnings
   */
  async buildClaimWinningsTransaction(
    marketId: number,
    options: {
      senderKey: string;
      fee?: number;
      nonce?: number;
    }
  ) {
    const senderAddress = getAddressFromPrivateKey(
      options.senderKey,
      this.networkType === "mainnet" ? TransactionVersion.Mainnet : TransactionVersion.Testnet
    );

    const nonce = options.nonce ?? (await getNonce(senderAddress, this.network));

    const txOptions: SignedContractCallOptions = {
      contractAddress: this.contractIdentifier.split(".")[0],
      contractName: this.contractIdentifier.split(".")[1],
      functionName: "claim-winnings",
      functionArgs: [uintCV(marketId)],
      senderKey: options.senderKey,
      fee: options.fee,
      nonce,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCall(txOptions);
  }

  /**
   * Broadcast a transaction to the network
   */
  async broadcastTransaction(transaction: any) {
    try {
      const result = await broadcastTx(transaction, this.network);
      return result;
    } catch (error) {
      console.error("Error broadcasting transaction:", error);
      throw error;
    }
  }

  /**
   * Get the network instance
   */
  getNetwork(): StacksNetwork {
    return this.network;
  }

  /**
   * Get the contract identifier
   */
  getContractIdentifier(): string {
    return this.contractIdentifier;
  }
}

/**
 * Create a transaction service instance
 */
export function createTransactionService(config?: Partial<ContractConfig>) {
  const serviceConfig = { ...defaultContractConfig, ...config };
  return new HiroPickTransactionService(serviceConfig);
}
