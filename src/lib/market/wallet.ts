import type { Accept } from "./catalog";
import { assertPaymentSignatureAllowed, noteSignatureRequest } from "@/lib/spend";
import type { SpendOffer } from "@/lib/mandate";

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
  "84532": {
    chainId: "0x14a34",
    chainName: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    symbol: "ETH",
    explorer: "https://sepolia.basescan.org",
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
  "10": {
    chainId: "0xa",
    chainName: "Optimism",
    rpc: "https://mainnet.optimism.io",
    symbol: "ETH",
    explorer: "https://optimistic.etherscan.io",
  },
  "56": {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    rpc: "https://bsc-dataseed.binance.org",
    symbol: "BNB",
    explorer: "https://bscscan.com",
  },
  "43114": {
    chainId: "0xa86a",
    chainName: "Avalanche",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    symbol: "AVAX",
    explorer: "https://snowtrace.io",
  },
};

let active: EthereumProvider | null = null;

function readInjected(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    ethereum?: EthereumProvider;
    coinbaseWalletExtension?: EthereumProvider;
    phantom?: { ethereum?: EthereumProvider };
    okxwallet?: EthereumProvider;
  };
  return win.ethereum ?? win.coinbaseWalletExtension ?? win.phantom?.ethereum ?? win.okxwallet ?? null;
}

export function ethereumProvider(): EthereumProvider | null {
  return active ?? readInjected();
}

async function coinbaseProvider(): Promise<EthereumProvider> {
  const { createCoinbaseWalletSDK } = await import("@coinbase/wallet-sdk");
  const sdk = createCoinbaseWalletSDK({
    appName: "Find & Buy Agent",
    appLogoUrl: "https://findbuyagent.com/favicon.svg",
    preference: { options: "all" },
  });
  return sdk.getProvider() as unknown as EthereumProvider;
}

export type WalletChoice = { id: string; name: string; icon?: string; provider: EthereumProvider };

export function discoverWallets(): Promise<WalletChoice[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  return new Promise((resolve) => {
    const found: WalletChoice[] = [];
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<{ info?: { uuid?: string; name?: string; icon?: string }; provider?: EthereumProvider }>).detail;
      const info = detail.info;
      if (!detail?.provider || !info?.uuid) return;
      if (found.some((item) => item.id === info.uuid)) return;
      found.push({ id: info.uuid, name: info.name || "Wallet", icon: info.icon, provider: detail.provider });
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      const injected = readInjected();
      if (injected && found.length === 0) found.push({ id: "injected", name: "Browser wallet", provider: injected });
      resolve(found);
    }, 250);
  });
}

export async function connectProvider(provider: EthereumProvider): Promise<ConnectedWallet> {
  active = provider;
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("The wallet did not return an account.");
  const chainId = String(await provider.request({ method: "eth_chainId" }));
  const pub = { address, chainId };
  localStorage.setItem("fba-public-wallet", JSON.stringify(pub));
  window.dispatchEvent(new Event("fba-wallet"));
  bindWalletEvents();
  return pub;
}

export function readPublicWallet(): ConnectedWallet | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem("fba-public-wallet") || "null") as ConnectedWallet | null;
    if (!parsed?.address) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<ConnectedWallet> {
  const provider = readInjected();
  if (!provider) throw new Error("Open Find & Buy inside your wallet, then tap Buy. Nothing is spent in this browser.");
  active = provider;
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("The wallet did not return an account.");
  const chainId = String(await provider.request({ method: "eth_chainId" }));
  const pub = { address, chainId };
  localStorage.setItem("fba-public-wallet", JSON.stringify(pub));
  window.dispatchEvent(new Event("fba-wallet"));
  bindWalletEvents();
  return pub;
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

export function chainLabel(chainId: string): string {
  const id = chainId.startsWith("0x") ? String(Number.parseInt(chainId, 16)) : chainId;
  return CHAINS[id]?.chainName ?? `Chain ${chainId}`;
}

export function isBaseMainnet(chainId: string): boolean {
  const id = chainId.startsWith("0x") ? String(Number.parseInt(chainId, 16)) : chainId;
  return id === "8453";
}

export function disconnectWallet() {
  active = null;
  if (typeof localStorage !== "undefined") localStorage.removeItem("fba-public-wallet");
  if (typeof window !== "undefined") window.dispatchEvent(new Event("fba-wallet"));
}

let walletEventsBound = false;

export function bindWalletEvents() {
  if (walletEventsBound) return;
  const provider = ethereumProvider() ?? readInjected();
  if (!provider?.on) return;
  walletEventsBound = true;
  const sync = () => {
    void (async () => {
      try {
        const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
        if (!accounts?.[0]) {
          disconnectWallet();
          return;
        }
        active = provider;
        const chainId = String(await provider.request({ method: "eth_chainId" }));
        localStorage.setItem("fba-public-wallet", JSON.stringify({ address: accounts[0], chainId }));
        window.dispatchEvent(new Event("fba-wallet"));
      } catch {
        /* wallet unavailable */
      }
    })();
  };
  provider.on("accountsChanged", sync);
  provider.on("chainChanged", sync);
}

const USDC_TOKENS: Record<string, { token: string; decimals: number; rpc: string }> = {
  "8453": { token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, rpc: "https://mainnet.base.org" },
  "1": { token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, rpc: "https://cloudflare-eth.com" },
  "137": { token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, rpc: "https://polygon-rpc.com" },
  "42161": { token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, rpc: "https://arb1.arbitrum.io/rpc" },
  "10": { token: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, rpc: "https://mainnet.optimism.io" },
  "43114": { token: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6, rpc: "https://api.avax.network/ext/bc/C/rpc" },
  "56": { token: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, rpc: "https://bsc-dataseed.binance.org" },
};

function formatBalance(hex: string, decimals: number): string {
  const value = BigInt(hex);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = (value % base).toString().padStart(decimals, "0").slice(0, 2).replace(/0+$/, "");
  return frac ? `${whole.toString()}.${frac}` : whole.toString();
}

export async function readUsdcBalance(address: string, chainId: string): Promise<string | null> {
  const id = chainId.startsWith("0x") ? String(Number.parseInt(chainId, 16)) : chainId;
  const known = USDC_TOKENS[id];
  if (!known || !/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  const data = `0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`;
  try {
    let hex = "";
    const provider = ethereumProvider();
    if (provider) {
      try {
        hex = String(await provider.request({ method: "eth_call", params: [{ to: known.token, data }, "latest"] }));
      } catch {
        hex = "";
      }
    }
    if (!hex || hex === "0x") {
      const response = await fetch(known.rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: known.token, data }, "latest"] }),
      });
      const payload = (await response.json()) as { result?: string };
      hex = payload.result || "";
    }
    if (!hex || hex === "0x") return "0";
    return formatBalance(hex, known.decimals);
  } catch {
    return null;
  }
}

const LEGACY_NAMES: Record<string, string> = {
  "eip155:8453": "base",
  "eip155:84532": "base-sepolia",
  "eip155:1": "ethereum",
  "eip155:137": "polygon",
  "eip155:42161": "arbitrum",
  "eip155:10": "optimism",
  "eip155:43114": "avalanche",
  "eip155:56": "bsc",
};

function normalizeSignature(signature: string): string {
  const hex = signature.startsWith("0x") ? signature.slice(2) : signature;
  if (hex.length !== 130) {
    throw new Error("This wallet returned a smart-account signature this merchant cannot settle. Pay from a regular account on the selected chain.");
  }
  const v = Number.parseInt(hex.slice(128), 16);
  const fixed = v < 27 ? v + 27 : v;
  if (fixed !== 27 && fixed !== 28) throw new Error("The wallet signature could not be checked. Nothing was spent.");
  return `0x${hex.slice(0, 128)}${fixed.toString(16).padStart(2, "0")}`;
}

function encodePayload(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function challengeEcho(header: string, accept: Accept): { resource?: unknown; accepted?: unknown; extensions?: unknown } | undefined {
  if (!header) return undefined;
  try {
    const parsed = JSON.parse(header) as { resource?: unknown; accepts?: Record<string, unknown>[]; extensions?: unknown };
    const accepts = parsed.accepts ?? [];
    const accepted =
      accepts.find((item) => String(item.network) === accept.network && String(item.asset).toLowerCase() === accept.asset.toLowerCase()) ??
      accepts.find((item) => String(item.scheme) === "exact" && String(item.network).toLowerCase().includes(accept.network.split(":")[1] ?? "8453")) ??
      accepts[0];
    return { resource: parsed.resource, accepted, extensions: parsed.extensions };
  } catch {
    return undefined;
  }
}

export async function paymentBundle(
  account: string,
  resourceUrl: string,
  description: string,
  accept: Accept,
  echoed?: { resource?: unknown; accepted?: unknown; extensions?: unknown },
): Promise<{ v2: string; v1: string; signature: string; nonce: string }> {
  const priced = accept.priceLabel.startsWith("$") ? Number(accept.priceLabel.slice(1)) : Number.NaN;
  let merchant = "";
  try {
    merchant = new URL(resourceUrl).hostname.replace(/^www\./, "");
  } catch {
    merchant = "";
  }
  const offer: SpendOffer = {
    amountUsd: Number.isFinite(priced) ? priced : null,
    merchant,
    payTo: accept.payTo,
    chainId: Number(accept.network.split(":")[1]) || 0,
    asset: /usdc/i.test(`${accept.assetName} ${accept.asset}`) ? "USDC" : accept.assetName || "USDC",
    category: description,
    item: description.slice(0, 140) || merchant,
  };
  assertPaymentSignatureAllowed(offer);
  const ethereum = ethereumProvider();
  if (!ethereum) throw new Error("No wallet in this browser. Open Find & Buy inside the wallet, the same way monaf does.");
  if (!accept.evm || (accept.scheme !== "exact" && accept.scheme !== "eip3009")) {
    throw new Error("This merchant is not asking for an EVM stablecoin payment.");
  }
  const chainId = Number(accept.network.split(":")[1]);
  if (!Number.isFinite(chainId)) throw new Error("Unknown chain.");
  await ensureChain(accept.network);
  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  const nonce = `0x${[...nonceBytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const accepted = (echoed?.accepted ?? {
    scheme: "exact",
    network: accept.network,
    amount: accept.amount,
    asset: accept.asset,
    payTo: accept.payTo,
    maxTimeoutSeconds: accept.timeoutSeconds,
    extra: accept.extra,
  }) as { scheme?: string; network?: string; extra?: Record<string, string>; maxTimeoutSeconds?: number };
  const extra: Record<string, string> = { assetTransferMethod: "eip3009", ...accept.extra, ...(accepted.extra ?? {}) };
  const now = Math.floor(Date.now() / 1000);
  const timeout = Math.min(Math.max(accepted.maxTimeoutSeconds || accept.timeoutSeconds || 60, 30), 300);
  const validAfter = String(now - 5);
  const validBefore = String(now + timeout - 5);
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
      name: extra.name || "USD Coin",
      version: extra.version || "2",
      chainId,
      verifyingContract: accept.asset,
    },
    message: {
      from: account,
      to: accept.payTo,
      value: accept.amount,
      validAfter,
      validBefore,
      nonce,
    },
  };
  noteSignatureRequest();
  const signature = (await ethereum.request({
    method: "eth_signTypedData_v4",
    params: [account, JSON.stringify(typed)],
  })) as string;
  if (!signature) throw new Error("The wallet did not return a signature.");
  const packed = normalizeSignature(signature);
  const v2 = encodePayload({
    x402Version: 2,
    resource: echoed?.resource ?? { url: resourceUrl, description, mimeType: "application/json" },
    accepted: { ...accepted, extra },
    payload: { signature: packed, authorization: typed.message },
    ...(echoed?.extensions ? { extensions: echoed.extensions } : {}),
  });
  const legacy = LEGACY_NAMES[accept.network];
  const v1 = legacy
    ? encodePayload({
        x402Version: 1,
        scheme: "exact",
        network: legacy,
        payload: { signature, authorization: typed.message },
      })
    : "";
  return { v2, v1, signature: packed, nonce };
}

export async function signExactPayment(account: string, resourceUrl: string, description: string, accept: Accept): Promise<string> {
  return (await paymentBundle(account, resourceUrl, description, accept)).v2;
}

export async function signMandate(account: string, chainIdHex: string, rules: string): Promise<string> {
  const ethereum = ethereumProvider();
  if (!ethereum) throw new Error("Connect the agent wallet before signing permissions.");
  const chainId = Number(BigInt(chainIdHex));
  const typed = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      AgentMandate: [
        { name: "agent", type: "string" },
        { name: "wallet", type: "address" },
        { name: "rules", type: "string" },
      ],
    },
    primaryType: "AgentMandate",
    domain: {
      name: "Find & Buy Agent",
      version: "1",
      chainId,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    message: {
      agent: "FindBuyAgent",
      wallet: account,
      rules,
    },
  };
  const signature = (await ethereum.request({
    method: "eth_signTypedData_v4",
    params: [account, JSON.stringify(typed)],
  })) as string;
  if (!signature) throw new Error("The wallet did not return a signature.");
  return signature;
}

export const MONAF_URL = "https://monaf.ai/";

export function walletLinks(): { name: string; href: string }[] {
  const page =
    typeof window !== "undefined" && window.location.protocol === "https:" && !/localhost|127\.0\.0\.1/.test(window.location.hostname)
      ? window.location.href
      : "https://findbuyagent.com/";
  const bare = page.replace(/^https?:\/\//, "");
  const origin = new URL(page).origin;
  return [
    { name: "MetaMask", href: `https://link.metamask.io/dapp/${bare}` },
    { name: "Coinbase", href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(page)}` },
    { name: "Phantom", href: `https://phantom.com/ul/browse/${encodeURIComponent(page)}?ref=${encodeURIComponent(origin)}` },
    { name: "OKX", href: `https://web3.okx.com/download?deeplink=${encodeURIComponent(`okx://wallet/dapp/url?dappUrl=${encodeURIComponent(page)}`)}` },
    { name: "Trust", href: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(page)}` },
    { name: "monaf", href: MONAF_URL },
  ];
}

export const WALLET_LINKS = [
  { name: "MetaMask", href: "https://link.metamask.io/dapp/findbuyagent.com/" },
  { name: "Coinbase Wallet", href: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Ffindbuyagent.com%2F" },
  { name: "Phantom", href: "https://phantom.com/ul/browse/https%3A%2F%2Ffindbuyagent.com%2F?ref=https%3A%2F%2Fmonaf.ai" },
  { name: "OKX", href: "https://web3.okx.com/download?deeplink=okx%3A%2F%2Fwallet%2Fdapp%2Furl%3FdappUrl%3Dhttps%253A%252F%252Ffindbuyagent.com%252F" },
  { name: "Trust", href: "https://link.trustwallet.com/open_url?coin_id=60&url=https%3A%2F%2Ffindbuyagent.com%2F" },
  { name: "monaf", href: MONAF_URL },
];
