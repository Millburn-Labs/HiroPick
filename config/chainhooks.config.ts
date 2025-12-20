/**
 * Chainhooks configuration for HiroPick
 * Configure webhook endpoints and event filters for prediction market events
 */

export interface ChainhooksConfig {
  network: "mainnet" | "testnet";
  apiKey?: string;
  jwt?: string;
  baseUrl?: string;
  webhookUrl: string;
  contractAddress?: string;
  contractName: string;
}

export const defaultChainhooksConfig: ChainhooksConfig = {
  network: "testnet",
  contractName: "heropick",
  webhookUrl: process.env.CHAINHOOKS_WEBHOOK_URL || "http://localhost:3000/webhook",
  apiKey: process.env.CHAINHOOKS_API_KEY,
  jwt: process.env.CHAINHOOKS_JWT,
  baseUrl: process.env.CHAINHOOKS_BASE_URL,
};

/**
 * Event types emitted by the HiroPick contract
 */
export enum HiroPickEventType {
  MARKET_CREATED = "market_created",
  BET_PLACED = "bet_placed",
  MARKET_RESOLVED = "market_resolved",
  WINNINGS_CLAIMED = "winnings_claimed",
}

/**
 * Chainhook filter configuration for HiroPick events
 */
export function getChainhookFilters(contractAddress: string, contractName: string) {
  return [
    {
      contract_identifier: `${contractAddress}.${contractName}`,
      events: [
        {
          event_type: "contract_call",
          contract_identifier: `${contractAddress}.${contractName}`,
          function_name: "create-market",
        },
        {
          event_type: "contract_call",
          contract_identifier: `${contractAddress}.${contractName}`,
          function_name: "place-bet",
        },
        {
          event_type: "contract_call",
          contract_identifier: `${contractAddress}.${contractName}`,
          function_name: "resolve-market",
        },
        {
          event_type: "contract_call",
          contract_identifier: `${contractAddress}.${contractName}`,
          function_name: "claim-winnings",
        },
      ],
    },
    {
      stx_transfer: {
        sender: contractAddress,
      },
    },
  ];
}

