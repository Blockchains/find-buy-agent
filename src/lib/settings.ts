export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const PER_PAYMENT_MAX = 25;
export const PER_DAY_MAX = 100;

export type Settings = {
  perPaymentUsd: number;
  perDayUsd: number;
  hosts: string[];
  payees: string[];
  reducedMotion: boolean;
  developer: boolean;
  walletConnectId: string;
};

export const SEED_HOSTS = ["api-xpay.com", "www.api-xpay.com", "api.onesource.io", "blockrun.ai"];

export const SEED_PAYEES = [
  "0x589a2314a2E05f45e40C4823Da3Ba58D421dB3d8",
  "0x52E29e0d2Aa49bfBfC548C0A9F2196F4aa51f3ea",
  "0xe9030014F5DAe217d0A152f02A043567b16c1aBf",
];

const KEY = "fba-settings-v1";

export function defaultSettings(): Settings {
  return {
    perPaymentUsd: 1,
    perDayUsd: 5,
    hosts: [...SEED_HOSTS],
    payees: [...SEED_PAYEES],
    reducedMotion: false,
    developer: false,
    walletConnectId: "",
  };
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0.01;
  return Math.min(value, max);
}

export function loadSettings(): Settings {
  const base = defaultSettings();
  if (typeof localStorage === "undefined") return base;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<Settings> | null;
    if (!parsed) return base;
    return {
      perPaymentUsd: clamp(Number(parsed.perPaymentUsd ?? base.perPaymentUsd), PER_PAYMENT_MAX),
      perDayUsd: clamp(Number(parsed.perDayUsd ?? base.perDayUsd), PER_DAY_MAX),
      hosts: Array.isArray(parsed.hosts) ? [...new Set(parsed.hosts.map((host) => String(host).toLowerCase()))] : base.hosts,
      payees: Array.isArray(parsed.payees) ? [...new Set(parsed.payees.map((payee) => String(payee)))] : base.payees,
      reducedMotion: Boolean(parsed.reducedMotion),
      developer: Boolean(parsed.developer),
      walletConnectId: typeof parsed.walletConnectId === "string" ? parsed.walletConnectId.trim().slice(0, 80) : "",
    };
  } catch {
    return base;
  }
}

export function saveSettings(next: Settings) {
  const clean: Settings = {
    ...next,
    perPaymentUsd: clamp(next.perPaymentUsd, PER_PAYMENT_MAX),
    perDayUsd: clamp(next.perDayUsd, PER_DAY_MAX),
    walletConnectId: next.walletConnectId.trim().slice(0, 80),
  };
  localStorage.setItem(KEY, JSON.stringify(clean));
  window.dispatchEvent(new Event("fba-settings"));
  return clean;
}
