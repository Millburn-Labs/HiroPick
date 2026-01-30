// @ts-ignore - ChainhooksClient export issue in type definitions
import { ChainhooksClient } from "@hirosystems/chainhooks-client";

/**
 * Chainhooks service for HiroPick prediction market
 * Handles event monitoring and processing for prediction market events
 */
export class HiroPickChainhooksService {
  private client: ChainhooksClient;
  private network: "mainnet" | "testnet";

  constructor(config: {
    network?: "mainnet" | "testnet";
    apiKey?: string;
    jwt?: string;
    baseUrl?: string;
  }) {
    const { network = "testnet", apiKey, jwt, baseUrl } = config;
    this.network = network;

    // Initialize chainhooks client
    // Only include properties that are defined to avoid undefined type errors
    const clientConfig: {
      network: string;
      apiKey?: string;
      jwt?: string;
      baseUrl?: string;
    } = {
      network,
      ...(apiKey !== undefined && { apiKey }),
      ...(jwt !== undefined && { jwt }),
      ...(baseUrl !== undefined && { baseUrl }),
    };

    this.client = new ChainhooksClient(clientConfig as any);
  }

  /**
   * Register a chainhook to monitor prediction market events
   */
  async registerPredictionMarketHook(contractAddress: string, contractName: string) {
    try {
      const hook = await this.client.registerChainhook({
        name: `hiropick-${contractName}-events`,
        version: "1",
        chain: "stacks",
        network: this.network,
        options: {
          enable_on_registration: true,
        },
        filters: {
          events: [
            {
              type: "contract_call",
              contract_identifier: `${contractAddress}.${contractName}`,
            },
          ],
        },
        action: {
          type: "http_post",
          url: process.env.CHAINHOOKS_WEBHOOK_URL || "http://localhost:3000/webhook",
        },
      });

      return hook;
    } catch (error) {
      console.error("Error registering chainhook:", error);
      throw error;
    }
  }

  /**
   * List all registered hooks for the prediction market
   */
  async listHooks() {
    try {
      const hooks = await this.client.getChainhooks();
      return hooks;
    } catch (error) {
      console.error("Error listing hooks:", error);
      throw error;
    }
  }

  /**
   * Get a specific hook by ID
   */
  async getHook(hookId: string) {
    try {
      const hook = await this.client.getChainhook(hookId);
      return hook;
    } catch (error) {
      console.error("Error getting hook:", error);
      throw error;
    }
  }

  /**
   * Delete a chainhook
   */
  async deleteHook(hookId: string) {
    try {
      await this.client.deleteChainhook(hookId);
      return true;
    } catch (error) {
      console.error("Error deleting hook:", error);
      throw error;
    }
  }

  /**
   * Process prediction market events from chainhook webhook
   */
  processMarketEvent(event: any): ProcessedEvent | null {
    // Parse and process different event types
    const eventType = event.event_type;
    
    switch (eventType) {
      case "contract_call":
        return this.processContractCallEvent(event);
      case "stx_transfer":
        return this.processStxTransferEvent(event);
      default:
        console.warn("Unknown event type:", eventType);
        return null;
    }
  }

  private processContractCallEvent(event: any): ProcessedEvent {
    const functionName = event.contract_call?.function_name;
    const blockHeight = event.block_height ?? 0;
    const txId = event.tx_id ?? "";
    
    // Handle different function calls
    switch (functionName) {
      case "create-market":
        return {
          type: "market_created",
          data: event.contract_call?.function_args,
          txId,
          blockHeight,
        };
      case "place-bet":
        return {
          type: "bet_placed",
          data: event.contract_call?.function_args,
          txId,
          blockHeight,
        };
      case "resolve-market":
        return {
          type: "market_resolved",
          data: event.contract_call?.function_args,
          txId,
          blockHeight,
        };
      default:
        return {
          type: "unknown_contract_call",
          data: { functionName, contractCall: event.contract_call },
          txId,
          blockHeight,
        };
    }
  }

  private processStxTransferEvent(event: any): ProcessedEvent {
    return {
      type: "stx_transfer",
      data: {
        sender: event.stx_transfer?.sender,
        recipient: event.stx_transfer?.recipient,
        amount: event.stx_transfer?.amount,
      },
      txId: event.tx_id ?? "",
      blockHeight: event.block_height ?? 0,
    };
  }
}

/**
 * Processed event type from chainhooks
 */
export interface ProcessedEvent {
  type: string;
  data: any;
  txId: string;
  blockHeight: number;
}

/**
 * Create a chainhooks service instance
 */
export function createChainhooksService(config?: {
  network?: "mainnet" | "testnet";
  apiKey?: string;
  jwt?: string;
  baseUrl?: string;
}) {
  return new HiroPickChainhooksService(config || { network: "testnet" });
}

