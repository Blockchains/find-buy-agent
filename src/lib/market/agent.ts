import type { Offer } from "./catalog";

export type Delivery = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  phone: string;
  notes: string;
};

export type Rules = {
  cheaper: boolean;
  urgent: boolean;
  reputation: boolean;
  maxUsd: number;
  dailyUsd: number;
  auto: boolean;
};

export type Mandate = {
  signature: string;
  address: string;
  signedAt: string;
  digest: string;
};

export type Fulfillment = {
  id: string;
  at: string;
  title: string;
  url: string;
  price: string;
  payTo: string;
  status: "paid" | "unconfirmed" | "stopped";
  detail: string;
  deliverTo: string;
};

export type Ranked = {
  offer: Offer;
  usd: number | null;
  reasons: string[];
};

export const COUNTRIES = [
  "Australia",
  "Canada",
  "China",
  "France",
  "Germany",
  "Hong Kong",
  "India",
  "Indonesia",
  "Ireland",
  "Italy",
  "Japan",
  "Malaysia",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Qatar",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
] as const;

const KEY = "fba-agent-v1";

export const emptyDelivery = (): Delivery => ({
  name: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postcode: "",
  country: "",
  phone: "",
  notes: "",
});

export const defaultRules = (): Rules => ({
  cheaper: true,
  urgent: true,
  reputation: true,
  maxUsd: 20,
  dailyUsd: 50,
  auto: false,
});

type Stored = { delivery: Delivery; rules: Rules; mandate: Mandate | null; orders: Fulfillment[] };

export function loadAgent(): Stored {
  const blank = { delivery: emptyDelivery(), rules: defaultRules(), mandate: null, orders: [] as Fulfillment[] };
  if (typeof localStorage === "undefined") return blank;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      delivery: { ...emptyDelivery(), ...parsed.delivery },
      rules: { ...defaultRules(), ...parsed.rules },
      mandate: parsed.mandate ?? null,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return blank;
  }
}

export function saveAgent(value: Stored) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function deliveryReady(delivery: Delivery): boolean {
  return Boolean(delivery.name && delivery.line1 && delivery.city && delivery.postcode && delivery.country);
}

export function deliveryLine(delivery: Delivery): string {
  return [delivery.name, delivery.line1, delivery.line2, delivery.city, delivery.region, delivery.postcode, delivery.country, delivery.phone]
    .filter(Boolean)
    .join(", ");
}

export function rulesText(rules: Rules, delivery: Delivery): string {
  return [
    rules.cheaper ? "Buy the lowest verified price in the result set." : "Price rank is not required.",
    rules.urgent ? "Prefer the shortest settlement window." : "Speed is not required.",
    rules.reputation ? "Prefer listings with more paying agents in the last 30 days." : "Reputation is not required.",
    `Max ${rules.maxUsd} USD per order.`,
    `Max ${rules.dailyUsd} USD per day.`,
    rules.auto ? "Auto-purchase the best match." : "Ask before every purchase.",
    `Deliver to ${deliveryLine(delivery) || "an incomplete address"}.`,
    delivery.notes ? `Notes: ${delivery.notes}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function digestOf(rules: Rules, delivery: Delivery): string {
  return rulesText(rules, delivery);
}

function usdOf(offer: Offer): number | null {
  const label = offer.accepts.find((accept) => accept.priceLabel.startsWith("$"))?.priceLabel;
  if (!label) return null;
  const value = Number(label.slice(1));
  return Number.isFinite(value) ? value : null;
}

export function rankOffers(offers: Offer[], rules: Rules): Ranked[] {
  let rows = offers.map((offer) => ({
    offer,
    usd: usdOf(offer),
    payers: offer.payers,
    window: Math.min(...offer.accepts.map((accept) => accept.timeoutSeconds || 9999)),
  }));
  if (rules.reputation) {
    const trusted = rows.filter((row) => row.payers >= 5);
    if (trusted.length > 0) rows = trusted;
  }
  rows = rows.filter((row) => row.usd === null || row.usd <= rules.maxUsd);
  rows.sort((a, b) => {
    if (rules.cheaper && a.usd !== b.usd) return (a.usd ?? 1e12) - (b.usd ?? 1e12);
    if (rules.urgent && a.window !== b.window) return a.window - b.window;
    if (rules.reputation && a.payers !== b.payers) return b.payers - a.payers;
    return 0;
  });
  return rows.map((row) => ({
    offer: row.offer,
    usd: row.usd,
    reasons: [
      rules.cheaper && row.usd !== null ? "Lowest price" : "",
      rules.urgent ? (row.window <= 90 ? "Instant" : "Shortest window") : "",
      rules.reputation && row.payers > 0 ? `${row.payers} payers / 30d` : "",
    ].filter(Boolean),
  }));
}

export function spentToday(orders: Fulfillment[]): number {
  const day = new Date().toISOString().slice(0, 10);
  return orders
    .filter((order) => order.at.slice(0, 10) === day && order.status === "paid")
    .reduce((sum, order) => sum + (Number(order.price.replace(/[^0-9.]/g, "")) || 0), 0);
}
