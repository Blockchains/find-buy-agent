export type DemoReceipt = {
  id: string;
  at: string;
  prompt: string;
  item: string;
  merchant: string;
  total: string;
  chain: string;
  asset: string;
  payTo: string;
  status: "simulated" | "signed" | "declined";
  signature: string;
  example: true;
};

const KEY = "fba-demo-receipts-v1";

export function loadReceipts(): DemoReceipt[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as DemoReceipt[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.example === true) : [];
  } catch {
    return [];
  }
}

export function saveReceipt(receipt: DemoReceipt): DemoReceipt[] {
  const next = [receipt, ...loadReceipts()].slice(0, 30);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
