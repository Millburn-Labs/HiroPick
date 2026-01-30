/**
 * Contract configuration for HiroPick
 * Configure contract address, network, and related settings
 */

export type Network = "mainnet" | "testnet" | "devnet";

export interface ContractConfig {
  contractAddress: string;
  contractName: string;
  network: Network;
}

/**
 * Default contract configuration
 * Update these values based on your deployment
 */
export const defaultContractConfig: ContractConfig = {
  contractAddress: process.env.CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  contractName: "heropick",
  network: (process.env.NETWORK as Network) || "testnet",
};

/**
 * Get Stacks network configuration
 */
export function getStacksNetwork(network: Network) {
  const networkConfig = {
    testnet: {
      url: "https://api.testnet.hiro.so",
      chainId: 2147483648,
    },
    mainnet: {
      url: "https://api.hiro.so",
      chainId: 1,
    },
    devnet: {
      url: "http://localhost:3999",
      chainId: 2147483648,
    },
  };

  return networkConfig[network];
}

/**
 * Get contract identifier
 */
export function getContractIdentifier(config: ContractConfig): string {
  return `${config.contractAddress}.${config.contractName}`;
}
