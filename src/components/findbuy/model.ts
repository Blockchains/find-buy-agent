export type Tab = "shop" | "vault" | "orders";
export type JobKey = "amazon" | "nike" | "bestbuy" | "costco" | "etsy" | "ups";
export type PillTone = "fill" | "mint" | "line" | "ghost";
export type Run = "film" | "side";
export type Phase = "cinema" | "ask" | "resolving" | "live";
export type TvState = "open" | "bought" | "passed";

export type Badge = {
  tone: "queue" | "work" | "mint" | "wait";
  label: string;
};

export type Job = {
  key: JobKey;
  letter: string;
  name: string;
  brief: string;
  line: string;
  badge: Badge;
  hot: boolean;
};

export type Offer = {
  id: string;
  store: string;
  name: string;
  rating: number | null;
  price: number;
  lowest?: boolean;
  blocked?: boolean;
  art: "tv" | "letter";
  ribbon?: string;
};

export type TrackStep = { label: string; detail: string };

export type PendingBuy = {
  tag: "tv" | "coffee" | "custom";
  question: string;
  sub: string;
  title: string;
  store: string;
  price: number;
  note: string;
  mode: "paid" | "scheduled";
  when: string;
  foot?: string;
  carrier?: string;
  tracking?: string;
  steps?: TrackStep[];
  job?: JobKey;
  boughtBadge?: Badge;
  declineBadge?: Badge;
};

export type Order = {
  id: string;
  num: number;
  store: string;
  title: string;
  price: number;
  note: string;
  carrier?: string;
  tracking?: string;
  steps: TrackStep[];
  step: number;
  foot?: string;
  mode: "paid" | "scheduled";
  when: string;
  tag: PendingBuy["tag"];
};

export type PickItem = {
  id?: string;
  name: string;
  meta: string;
  price: string;
  rating: string;
  detail?: string;
  how?: string;
  inputs?: string;
  returns?: string;
  docs?: string;
};

export type Phone =
  | { view: "blank" }
  | { view: "scan"; bubble: string; image?: string; href?: string; seen: number; offers: Offer[]; sub: string }
  | {
      view: "found";
      bubble: string;
      image?: string;
      href?: string;
      offers: Offer[];
      sub: string;
      showBuy: boolean;
      pending?: PendingBuy;
    }
  | {
      view: "ask";
      kicker: string;
      title: string;
      priceLine: string;
      sub: string;
      rows: { k: string; v: string; pill?: boolean }[];
      pending: PendingBuy;
      links?: { name: string; href: string }[];
      approveLabel?: string;
    }
  | { view: "track"; orderId: string }
  | { view: "digest" }
  | { view: "held"; title: string; detail: string; pending: PendingBuy }
  | {
      view: "picks";
      kicker: string;
      title: string;
      sub: string;
      items: PickItem[];
      pending?: PendingBuy;
    }
  | { view: "note"; kicker: string; title: string; sub: string; rows: { k: string; v: string }[] };

export type State = {
  tab: Tab;
  phase: Phase;
  run: Run;
  typed: string;
  command: string;
  typing: boolean;
  booted: boolean;
  clock: string;
  pill: string;
  pillTone: PillTone;
  checked: number;
  goal: number;
  savings: number;
  asked: number;
  askSlotsUsed: number;
  approved: number;
  tv: TvState;
  phone: Phone;
  jobs: Job[];
  orders: Order[];
  balance: number;
  input: string;
};

export type Brief =
  | { type: "tv" }
  | { type: "nike" }
  | { type: "bestbuy" }
  | { type: "costco" }
  | { type: "etsy" }
  | { type: "ups" }
  | { type: "custom"; text: string; buy: boolean; image?: string; href?: string };

export const BALANCE0 = 842012;
export const FILM_COMMAND = "findbuy --not-amazon --vault --ask-first";
export const FILM_BUBBLE = "Find this exact item at another store for less";

const SHIP: TrackStep[] = [
  { label: "Ordered", detail: "Oct 30, 9:14" },
  { label: "Shipped", detail: "FedEx · Oct 30" },
  { label: "Out for delivery", detail: "Fri, by 7pm" },
  { label: "Delivered", detail: "" },
];

export const TV_OFFERS: Offer[] = [
  { id: "bb", store: "Best Buy", name: '65" OLED TV', rating: 4.8, price: 139999, art: "tv" },
  {
    id: "wm",
    store: "Walmart",
    name: '65" OLED TV',
    rating: 4.7,
    price: 129999,
    lowest: true,
    art: "tv",
  },
  { id: "tg", store: "Target", name: '65" OLED TV', rating: 4.7, price: 134999, art: "tv" },
  {
    id: "az",
    store: "Amazon",
    name: '65" OLED TV',
    rating: null,
    price: 169999,
    blocked: true,
    art: "tv",
  },
];

export const TV_PENDING: PendingBuy = {
  tag: "tv",
  question: "Buy it at Walmart for",
  sub: "same model · in stock · $400 less than amazon",
  title: '65" OLED TV',
  store: "Walmart",
  price: 129999,
  note: "paid from the vault · you approved it",
  mode: "paid",
  when: "Oct 30, 9:14",
  foot: "$400 less than Amazon. 1 tap",
  carrier: "FedEx",
  tracking: "7749···2210",
  steps: SHIP,
  job: "amazon",
  boughtBadge: { tone: "mint", label: "-$400" },
  declineBadge: { tone: "wait", label: "Watching" },
};

export const COFFEE_PENDING: PendingBuy = {
  tag: "coffee",
  question: "Start Costco coffee for",
  sub: "Every 30 days. I'll ask again before each refill.",
  title: "Kirkland coffee",
  store: "Costco",
  price: 1849,
  note: "scheduled · not captured",
  mode: "scheduled",
  when: "Nov 29",
  job: "costco",
  boughtBadge: { tone: "wait", label: "Next Nov 29" },
  declineBadge: { tone: "wait", label: "Not now" },
};

export const NIKE_ITEMS: PickItem[] = [
  { name: "Pegasus 41", meta: "size 10 · men's", price: "$79", rating: "4.8" },
  { name: "Vomero 18", meta: "size 10 · men's", price: "$76", rating: "4.9" },
  { name: "Revolution 7", meta: "size 10 · men's", price: "$64", rating: "4.6" },
];

export const NIKE_PENDING: PendingBuy = {
  tag: "custom",
  question: "Buy the Pegasus 41 for",
  sub: "size 10 · top rated · under $80",
  title: "Pegasus 41",
  store: "Nike",
  price: 7900,
  note: "paid from the vault · you approved it",
  mode: "paid",
  when: "Oct 30, 9:20",
  foot: "Top rated. Size 10. Under $80.",
  carrier: "UPS",
  tracking: "1Z88···440",
  steps: [
    { label: "Ordered", detail: "Oct 30, 9:20" },
    { label: "Shipped", detail: "Nike · Oct 31" },
    { label: "Out for delivery", detail: "Tue, by 8pm" },
    { label: "Delivered", detail: "" },
  ],
  job: "nike",
  boughtBadge: { tone: "mint", label: "Ordered" },
  declineBadge: { tone: "mint", label: "3 picks" },
};

export const ETSY_ITEMS: PickItem[] = [
  { name: "Linen scarf", meta: "ships by Friday", price: "$42", rating: "4.9" },
  { name: "Ceramic cup", meta: "stoneware", price: "$28", rating: "4.8" },
  { name: "Pressed flowers", meta: "framed", price: "$36", rating: "4.7" },
];

export const ETSY_PENDING: PendingBuy = {
  tag: "custom",
  question: "Buy the linen scarf for",
  sub: "for mom · under $50 · by Friday",
  title: "Linen scarf",
  store: "Etsy",
  price: 4200,
  note: "paid from the vault · you approved it",
  mode: "paid",
  when: "Oct 30, 9:22",
  foot: "Under $50. Arrives by Friday.",
  carrier: "USPS",
  tracking: "9400···118",
  steps: [
    { label: "Ordered", detail: "Oct 30, 9:22" },
    { label: "Shipped", detail: "Etsy · Oct 31" },
    { label: "Out for delivery", detail: "Fri, by 7pm" },
    { label: "Delivered", detail: "" },
  ],
  job: "etsy",
  boughtBadge: { tone: "mint", label: "Ordered" },
  declineBadge: { tone: "mint", label: "3 picks" },
};

const JOB_SEED: Omit<Job, "badge" | "hot">[] = [
  {
    key: "amazon",
    letter: "A",
    name: "Amazon",
    brief: "this exact item, another store, for less",
    line: "same TV, another store",
  },
  {
    key: "nike",
    letter: "N",
    name: "Nike",
    brief: "size 10, under $80, top rated, show me 3",
    line: "size 10, under $80",
  },
  {
    key: "bestbuy",
    letter: "B",
    name: "Best Buy",
    brief: "headphones, message me at -20%",
    line: "headphones at −20%",
  },
  {
    key: "costco",
    letter: "C",
    name: "Costco",
    brief: "coffee every 30 days, ask me first",
    line: "coffee, every 30 days",
  },
  {
    key: "etsy",
    letter: "E",
    name: "Etsy",
    brief: "3 gifts for mom, under $50, by friday",
    line: "gifts for mom, under $50",
  },
  {
    key: "ups",
    letter: "U",
    name: "UPS",
    brief: "tell me the day one runs late",
    line: "late orders",
  },
];

export function freshJobs(): Job[] {
  return JOB_SEED.map((job) => ({
    ...job,
    hot: false,
    badge: { tone: "queue", label: "Queued" },
  }));
}

export function freshState(): State {
  return {
    tab: "shop",
    phase: "cinema",
    run: "film",
    typed: "",
    command: "",
    typing: true,
    booted: false,
    clock: "9:12",
    pill: "shopping",
    pillTone: "fill",
    checked: 0,
    goal: 4,
    savings: 0,
    asked: 1,
    askSlotsUsed: 0,
    approved: 0,
    tv: "open",
    phone: { view: "blank" },
    jobs: freshJobs(),
    orders: [],
    balance: BALANCE0,
    input: "",
  };
}

export function money(cents: number): string {
  const neg = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const body = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const tail = rem === 0 ? "" : `.${String(rem).padStart(2, "0")}`;
  return `${neg ? "-" : ""}$${body}${tail}`;
}

export function commandFor(query: string): string {
  return `findbuy "${query.replace(/"/g, "").trim()}" --ask-first`;
}

export function looksLikeLink(raw: string): boolean {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return false;
  if (/^https?:\/\//i.test(text)) return true;
  return /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(text);
}

export function normalizeLink(raw: string): string | null {
  const text = raw.trim();
  if (!looksLikeLink(text)) return null;
  const withProto = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withProto);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function labelFromLink(href: string): string {
  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, "");
  const skip = /^(dp|gp|ip|product|products|item|items|p|ref|sku|shop|buy|s|d)$/i;
  const titled = decodeURIComponent(url.pathname)
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/\.(html|htm|php|aspx)$/i, ""))
    .filter((part) => part.length > 2 && !skip.test(part) && !/^\d+$/.test(part) && !/^[A-Z0-9]{10}$/.test(part))
    .map((part) => part.replace(/[-_+]+/g, " ").replace(/\s+/g, " ").trim())
    .filter((part) => part.length > 2)
    .sort((a, b) => b.length - a.length);
  const name = titled[0];
  if (name && name.length >= 3) return name.slice(0, 72);
  return host;
}

export function labelFromPhoto(name: string): string {
  const base = name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base || /^(img|image|photo|picture|dsc|screenshot|pxl|scan)(\s*\d+)?$/i.test(base)) {
    return "Item in your photo";
  }
  return base.slice(0, 60);
}

export function cheaperLine(offers: Offer[]): string {
  const amazon = offers.find((offer) => offer.blocked);
  const ref = amazon?.price ?? Number.POSITIVE_INFINITY;
  const count = offers.filter((offer) => !offer.blocked && offer.price < ref).length;
  const noun = count === 1 ? "store" : "stores";
  return `${count} ${noun} cheaper · amazon blocked`;
}

export function askView(pending: PendingBuy): Extract<Phone, { view: "ask" }> {
  return {
    view: "ask",
    kicker: "One question",
    title: pending.question,
    priceLine: `${money(pending.price)}?`,
    sub: pending.sub,
    rows: [
      { k: "Item", v: pending.title },
      { k: "Store", v: pending.store },
      { k: "Pay with", v: "vault card", pill: true },
      { k: "Total", v: money(pending.price) },
    ],
    pending,
  };
}

export function classify(raw: string): Brief {
  const q = raw.trim().toLowerCase();
  if (/\btv\b|oled|exact item|another store/.test(q)) return { type: "tv" };
  if (/coffee|kirkland/.test(q) || (/costco/.test(q) && /refill|every|coffee/.test(q))) {
    return { type: "costco" };
  }
  if (/nike|sneaker|pegasus|vomero|size 10/.test(q)) return { type: "nike" };
  if (/headphone|bose|sony|best buy|-20|20%/.test(q)) return { type: "bestbuy" };
  if (/etsy|gift|mom|scarf/.test(q)) return { type: "etsy" };
  if (/ups|fedex|usps|package|parcel|runs late|on the way/.test(q)) return { type: "ups" };
  if (/walmart|not-amazon|cheaper/.test(q)) return { type: "tv" };
  const buy = /\b(buy|order|purchase|checkout)\b/.test(q);
  return { type: "custom", text: raw.trim(), buy };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function customOffers(text: string): Offer[] {
  const h = hash(text.toLowerCase());
  const name = text.replace(/^\s*(please\s+)?(buy|order|get)\s+/i, "").trim().slice(0, 42) || "That item";
  const stores = ["Best Buy", "Walmart", "Target", "Amazon"];
  const priced: Offer[] = stores.map((store, i) => ({
    id: store.toLowerCase().replace(/\s/g, ""),
    store,
    name,
    rating: store === "Amazon" ? null : (42 + ((h >> i) % 7)) / 10,
    price: 4200 + ((h >> (i * 4)) % 7000) + i * 350,
    blocked: store === "Amazon",
    art: "letter",
  }));
  let low = priced.find((offer) => !offer.blocked) ?? priced[0];
  if (!low) return priced;
  for (const offer of priced) {
    if (!offer.blocked && offer.price < low.price) low = offer;
  }
  return priced.map((offer) => {
    if (offer.blocked) return { ...offer, price: Math.max(offer.price, low.price + 1800), lowest: false };
    return { ...offer, lowest: offer.id === low.id };
  });
}

export function customPending(offer: Offer, savings: number): PendingBuy {
  return {
    tag: "custom",
    question: `Buy it at ${offer.store} for`,
    sub: savings > 0 ? `${money(savings)} under the Amazon listing · in stock` : "Lowest of the four · in stock",
    title: offer.name,
    store: offer.store,
    price: offer.price,
    note: "paid from the vault · you approved it",
    mode: "paid",
    when: "Oct 30",
    foot: savings > 0 ? `${money(savings)} less than Amazon. 1 tap` : "You approved the lowest price.",
    carrier: "UPS",
    tracking: "1Z44···908",
    steps: [
      { label: "Ordered", detail: "Oct 30" },
      { label: "Shipped", detail: `${offer.store} · Oct 31` },
      { label: "Out for delivery", detail: "Mon, by 6pm" },
      { label: "Delivered", detail: "" },
    ],
  };
}

export function digestCopy(state: State): { title: string; sub: string } {
  if (state.tv === "bought") {
    return { title: `Same TV. ${money(state.savings)} less.`, sub: "Nothing bought without you." };
  }
  if (state.tv === "passed") return { title: "Same TV. You passed.", sub: "Nothing bought." };
  return { title: "Nothing moves without you.", sub: "Jobs on the board. No captures yet." };
}

export function digestText(job: Job): string {
  if (job.badge.tone === "queue") return "queued";
  return job.badge.label.toLowerCase();
}

export function digestTone(job: Job): "mint" | "wait" | "muted" {
  if (job.badge.tone === "mint") return "mint";
  if (job.badge.tone === "wait" || job.badge.tone === "work") return "wait";
  return "muted";
}
