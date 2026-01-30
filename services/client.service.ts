/**
 * Client service for HiroPick using @stacks/connect
 * Handles wallet authentication and transaction signing from the client side
 */

import {
  openContractCall,
  UserSession,
  showConnect,
  AppConfig,
  FinishedTxData,
  FinishedAuthData,
} from "@stacks/connect";
import {
  uintCV,
  stringAsciiCV,
  boolCV,
} from "@stacks/transactions";
import {
  getContractIdentifier,
  defaultContractConfig,
  type ContractConfig,
  type Network,
} from "../config/contract.config.js";

/**
 * Client service for interacting with HiroPick contract via wallet
 */
export class HiroPickClientService {
  private contractIdentifier: string;
  private network: Network;
  private appConfig: AppConfig;
  private userSession: UserSession | null = null;

  constructor(config: ContractConfig) {
    this.contractIdentifier = getContractIdentifier(config);
    this.network = config.network;
    
    // Configure app for Stacks Connect
    this.appConfig = new AppConfig(
      ["store_write", "publish_data"],
      config.network === "mainnet"
        ? "https://app.hiro.so"
        : "https://explorer.stacks.co"
    );
    
    this.userSession = new UserSession({ appConfig: this.appConfig });
  }

  /**
   * Connect user's wallet
   */
  async connectWallet(): Promise<boolean> {
    try {
      const appDomain = typeof window !== "undefined" 
        ? window.location.origin 
        : "https://hiropick.app";
      
      const appDomain = typeof window !== "undefined" 
        ? window.location.origin 
        : "https://hiropick.app";
      
      await showConnect({
        appDetails: {
          name: "HiroPick",
          icon: appDomain + "/logo.png",
        },
        redirectTo: "/",
        onFinish: (data: FinishedAuthData) => {
          console.log("User data:", data);
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        },
        onCancel: () => {
          console.log("User cancelled connection");
        },
        userSession: this.userSession!,
      });
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.userSession?.isUserSignedIn() ?? false;
  }

  /**
   * Get current user session
   */
  getUserSession(): UserSession | null {
    return this.userSession;
  }

  /**
   * Get user's address
   */
  getUserAddress(): string | undefined {
    return this.userSession?.loadUserData()?.profile?.stxAddress?.[this.network];
  }

  /**
   * Sign out user
   */
  signOut(): void {
    this.userSession?.signUserOut();
  }

  /**
   * Create a market via wallet
   */
  async createMarket(
    description: string,
    category: string,
    endBlock: number,
    onFinish?: (data: FinishedTxData) => void,
    onCancel?: () => void
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("User must be authenticated to create a market");
    }

    const [contractAddress, contractName] = this.contractIdentifier.split(".");

    await openContractCall({
      network: this.network === "mainnet" ? "mainnet" : "testnet",
      contractAddress,
      contractName,
      functionName: "create-market",
      functionArgs: [
        stringAsciiCV(description),
        stringAsciiCV(category),
        uintCV(endBlock),
      ],
      appDetails: {
        name: "HiroPick",
        icon: (typeof window !== "undefined" ? window.location.origin : "https://hiropick.app") + "/logo.png",
      },
      onFinish: (data) => {
        console.log("Market creation transaction:", data);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log("User cancelled market creation");
        onCancel?.();
      },
    });
  }

  /**
   * Place a bet via wallet
   */
  async placeBet(
    marketId: number,
    outcome: boolean,
    amount: bigint,
    onFinish?: (data: FinishedTxData) => void,
    onCancel?: () => void
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("User must be authenticated to place a bet");
    }

    const [contractAddress, contractName] = this.contractIdentifier.split(".");

    await openContractCall({
      network: this.network === "mainnet" ? "mainnet" : "testnet",
      contractAddress,
      contractName,
      functionName: "place-bet",
      functionArgs: [
        uintCV(marketId),
        boolCV(outcome),
        uintCV(amount),
      ],
      appDetails: {
        name: "HiroPick",
        icon: (typeof window !== "undefined" ? window.location.origin : "https://hiropick.app") + "/logo.png",
      },
      // Include STX transfer amount
      stxAmount: amount.toString(),
      onFinish: (data) => {
        console.log("Bet placement transaction:", data);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log("User cancelled bet placement");
        onCancel?.();
      },
    });
  }

  /**
   * Resolve a market via wallet
   */
  async resolveMarket(
    marketId: number,
    winningOutcome: boolean,
    onFinish?: (data: FinishedTxData) => void,
    onCancel?: () => void
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("User must be authenticated to resolve a market");
    }

    const [contractAddress, contractName] = this.contractIdentifier.split(".");

    await openContractCall({
      network: this.network === "mainnet" ? "mainnet" : "testnet",
      contractAddress,
      contractName,
      functionName: "resolve-market",
      functionArgs: [
        uintCV(marketId),
        boolCV(winningOutcome),
      ],
      appDetails: {
        name: "HiroPick",
        icon: (typeof window !== "undefined" ? window.location.origin : "https://hiropick.app") + "/logo.png",
      },
      onFinish: (data) => {
        console.log("Market resolution transaction:", data);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log("User cancelled market resolution");
        onCancel?.();
      },
    });
  }

  /**
   * Claim winnings via wallet
   */
  async claimWinnings(
    marketId: number,
    onFinish?: (data: FinishedTxData) => void,
    onCancel?: () => void
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("User must be authenticated to claim winnings");
    }

    const [contractAddress, contractName] = this.contractIdentifier.split(".");

    await openContractCall({
      network: this.network === "mainnet" ? "mainnet" : "testnet",
      contractAddress,
      contractName,
      functionName: "claim-winnings",
      functionArgs: [uintCV(marketId)],
      appDetails: {
        name: "HiroPick",
        icon: (typeof window !== "undefined" ? window.location.origin : "https://hiropick.app") + "/logo.png",
      },
      onFinish: (data) => {
        console.log("Winnings claim transaction:", data);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log("User cancelled winnings claim");
        onCancel?.();
      },
    });
  }

  /**
   * Get contract identifier
   */
  getContractIdentifier(): string {
    return this.contractIdentifier;
  }
}

/**
 * Create a client service instance
 */
export function createClientService(config?: Partial<ContractConfig>) {
  const serviceConfig = { ...defaultContractConfig, ...config };
  return new HiroPickClientService(serviceConfig);
}
