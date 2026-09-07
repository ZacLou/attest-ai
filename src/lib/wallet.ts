import { BrowserProvider } from "ethers";

import { CREDITCOIN_CC3_TESTNET, SEPOLIA, type NetworkConfig } from "./chains";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function getInjectedProvider(): Eip1193Provider {
  if (!window.ethereum) {
    throw new Error("Please install an EVM wallet such as Bitget Wallet or MetaMask.");
  }
  return window.ethereum;
}

export async function connectWallet(): Promise<{ provider: BrowserProvider; address: string }> {
  const injected = getInjectedProvider();
  await injected.request({ method: "eth_requestAccounts" });
  const provider = new BrowserProvider(injected);
  const signer = await provider.getSigner();
  return { provider, address: await signer.getAddress() };
}

async function addChain(injected: Eip1193Provider, network: NetworkConfig): Promise<void> {
  try {
    await injected.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: network.hexChainId,
          chainName: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: network.rpcUrls,
          blockExplorerUrls: network.blockExplorerUrls,
        },
      ],
    });
  } catch (error) {
    throw new Error(`Please add ${network.name} to your wallet manually.`, { cause: error });
  }
}

export async function ensureNetwork(
  injected: Eip1193Provider,
  network: NetworkConfig,
): Promise<BrowserProvider> {
  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.hexChainId }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) {
      throw new Error(`Please switch your wallet to ${network.name}.`, { cause: error });
    }
    await addChain(injected, network);
  }

  return new BrowserProvider(injected, network.chainId);
}

export function ensureSepolia(injected: Eip1193Provider): Promise<BrowserProvider> {
  return ensureNetwork(injected, SEPOLIA);
}

export function ensureCreditcoin(injected: Eip1193Provider): Promise<BrowserProvider> {
  return ensureNetwork(injected, CREDITCOIN_CC3_TESTNET);
}
