import type { Accept } from "./catalog";

export type ConnectedWallet = {
  address: string;
  chainId: string;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

const CHAINS: Record<string, { chainId: string; chainName: string; rpc: string; symbol: string; explorer: string }> = {
  "8453": {
    chainId: "0x2105",
    chainName: "Base",
    rpc: "https://mainnet.base.org",
    symbol: "ETH",
    explorer: "https://basescan.org",
  },
  "143": {
    chainId: "0x8f",
    chainName: "Monad",
    rpc: "https://rpc.monad.xyz",
    symbol: "MON",
    explorer: "https://monadscan.com",
  },
  "137": {
    chainId: "0x89",
    chainName: "Polygon",
    rpc: "https://polygon-rpc.com",
    symbol: "POL",
    explorer: "https://polygonscan.com",
  },
  "42161": {
    chainId: "0xa4b1",
    chainName: "Arbitrum",
    rpc: "https://arb1.arbitrum.io/rpc",
    symbol: "ETH",
    explorer: "https://arbiscan.io",
  },
  "1": {
    chainId: "0x1",
    chainName: "Ethereum",
    rpc: "https://cloudflare-eth.com",
    symbol: "ETH",
    explorer: "https://etherscan.io",
  },
};

export function ethereumProvider(): EthereumProvider | null {
  const win = window as Window & { ethereum?: EthereumProvider };
  return win.ethereum ?? null;
}

export async function connectWallet(): Promise<ConnectedWallet> {
  const ethereum = ethereumProvider();
  if (!ethereum) throw new Error("No wallet in this browser. Open Find & Buy inside the wallet, the same way monaf does.");
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];
  if (!address) throw new Error("The wallet did not return an account.");
  const chainId = String(await ethereum.request({ method: "eth_chainId" }));
  return { address, chainId };
}

export async function ensureChain(network: string): Promise<void> {
  const ethereum = ethereumProvider();
  if (!ethereum) throw new Error("Wallet disconnected.");
  const chainNumber = network.toLowerCase().startsWith("eip155:") ? network.split(":")[1] : "";
  const known = CHAINS[chainNumber];
  if (!known) throw new Error(`This browser wallet cannot switch to ${network}.`);
  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: known.chainId }] });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) throw error;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: known.chainId,
          chainName: known.chainName,
          nativeCurrency: { name: known.symbol, symbol: known.symbol, decimals: 18 },
          rpcUrls: [known.rpc],
          blockExplorerUrls: [known.explorer],
        },
      ],
    });
  }
}

export async function signExactPayment(account: string, resourceUrl: string, description: string, accept: Accept): Promise<string> {
  const ethereum = ethereumProvider();
  if (!ethereum) throw new Error("Wallet disconnected.");
  if (!accept.evm || (accept.scheme !== "exact" && accept.scheme !== "eip3009")) {
    throw new Error("This accept path is not an EVM exact payment.");
  }
  const chainId = Number(accept.network.split(":")[1]);
  if (!Number.isFinite(chainId)) throw new Error("Unknown chain.");
  await ensureChain(accept.network);
  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  const nonce = `0x${[...nonceBytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const validBefore = Math.floor(Date.now() / 1000) + Math.max(accept.timeoutSeconds, 30);
  const typed = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    domain: {
      name: accept.extra.name || "USD Coin",
      version: accept.extra.version || "2",
      chainId,
      verifyingContract: accept.asset,
    },
    message: {
      from: account,
      to: accept.payTo,
      value: accept.amount,
      validAfter: "0",
      validBefore: String(validBefore),
      nonce,
    },
  };
  const signature = (await ethereum.request({
    method: "eth_signTypedData_v4",
    params: [account, JSON.stringify(typed)],
  })) as string;
  const payload = {
    x402Version: 2,
    resource: { url: resourceUrl, description, mimeType: "application/json" },
    accepted: {
      scheme: accept.scheme,
      network: accept.network,
      amount: accept.amount,
      asset: accept.asset,
      payTo: accept.payTo,
      maxTimeoutSeconds: accept.timeoutSeconds,
      extra: accept.extra,
    },
    payload: {
      signature,
      authorization: typed.message,
    },
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export const MONAF_URL = "https://monaf.ai/";

export const WALLET_LINKS = [
  { name: "MetaMask", href: "https://link.metamask.io/dapp/findbuyagent.com/" },
  { name: "Coinbase Wallet", href: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Ffindbuyagent.com%2F" },
  { name: "Phantom", href: "https://phantom.com/ul/browse/https%3A%2F%2Ffindbuyagent.com%2F?ref=https%3A%2F%2Fmonaf.ai" },
  { name: "OKX", href: "https://web3.okx.com/download?deeplink=okx%3A%2F%2Fwallet%2Fdapp%2Furl%3FdappUrl%3Dhttps%253A%252F%252Ffindbuyagent.com%252F" },
  { name: "Trust", href: "https://link.trustwallet.com/open_url?coin_id=60&url=https%3A%2F%2Ffindbuyagent.com%2F" },
  { name: "monaf", href: MONAF_URL },
];
