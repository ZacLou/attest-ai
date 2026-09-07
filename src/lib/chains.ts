export type NetworkConfig = {
  chainId: number;
  hexChainId: string;
  name: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls: string[];
};

export const SEPOLIA: NetworkConfig = {
  chainId: 11155111,
  hexChainId: "0xaa36a7",
  name: "Sepolia",
  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
  nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const CREDITCOIN_CC3_TESTNET: NetworkConfig = {
  chainId: 102031,
  hexChainId: "0x18e8f",
  name: "Creditcoin CC3 Testnet",
  rpcUrls: ["https://rpc.cc3-testnet.creditcoin.network"],
  nativeCurrency: { name: "Creditcoin Testnet", symbol: "tCTC", decimals: 18 },
  blockExplorerUrls: ["https://creditcoin-testnet.blockscout.com"],
};
