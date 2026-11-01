import { assertPublicHttps, loadMarket } from "./catalog";

export { loadMarket };

export async function probeResource(rawUrl: string): Promise<{ status: number; paymentRequired: string; snippet: string }> {
  const url = assertPublicHttps(rawUrl);
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    headers: { accept: "application/json, text/plain, */*" },
  });
  const paymentRequired = response.headers.get("payment-required");
  return {
    status: response.status,
    paymentRequired: paymentRequired ? decodeHeader(paymentRequired) : "",
    snippet: (await response.text()).slice(0, 2_000),
  };
}

export async function relaySignedGet(
  rawUrl: string,
  paymentSignature: string,
): Promise<{ status: number; paymentResponse: string; snippet: string }> {
  const url = assertPublicHttps(rawUrl);
  if (!paymentSignature || paymentSignature.length > 20_000) throw new Error("Missing payment signature.");
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    headers: {
      accept: "application/json, text/plain, */*",
      "payment-signature": paymentSignature,
      "x-payment": paymentSignature,
    },
  });
  return {
    status: response.status,
    paymentResponse: response.headers.get("payment-response") ?? "",
    snippet: (await response.text()).slice(0, 2_000),
  };
}

export async function readOnchainBalances(address: string): Promise<{ baseUsdc: string; monad: string }> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Not an EVM address.");
  const [usdc, mon] = await Promise.all([
    rpc("https://mainnet.base.org", "eth_call", [
      { to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", data: `0x70a08231${address.slice(2).padStart(64, "0")}` },
      "latest",
    ]),
    rpc("https://rpc.monad.xyz", "eth_getBalance", [address, "latest"]),
  ]);
  return { baseUsdc: formatUnits(usdc, 6), monad: formatUnits(mon, 18) };
}

function decodeHeader(value: string): string {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}

async function rpc(endpoint: string, method: string, params: unknown[]): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8_000),
  });
  const payload = (await response.json()) as { result?: string; error?: { message?: string } };
  if (!payload.result) throw new Error(payload.error?.message || `${method} failed`);
  return payload.result;
}

function formatUnits(hex: string, decimals: number): string {
  const value = BigInt(hex);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = (value % base).toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return frac ? `${whole.toString()}.${frac}` : whole.toString();
}
