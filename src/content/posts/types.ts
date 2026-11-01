export type Series = "Visa" | "Autonomous buying" | "x402" | "Foundations";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; label?: string; text: string }
  | { type: "table"; caption: string; columns: string[]; rows: string[][] };

export type Post = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  kicker: string;
  date: string;
  minutes: number;
  series: Series;
  featured?: boolean;
  keywords: string[];
  related: string[];
  blocks: Block[];
};

export type Listing = {
  slug: string;
  path: string;
  title: string;
  description: string;
  kicker: string;
  date: string;
  minutes: number;
  series: Series;
  featured?: boolean;
};
