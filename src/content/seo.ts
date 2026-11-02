export const ORIGIN = "https://findbuyagent.com";

export const OG_IMAGE = `${ORIGIN}/og.png`;

export const ARTICLE_PATH = "/blog/find-and-buy-agents" as const;

export const ARTICLE_URL = `${ORIGIN}${ARTICLE_PATH}`;

export const ARTICLE_H1 =
  "Find & Buy Agents: From the Ancient Agora to the Autonomous Protocol—The Fundamental Reshaping of Human Commerce and Trade";

export const ARTICLE_TITLE =
  "Find & Buy Agents: Agora to Autonomous Protocol | FindBuyAgent";

export const ARTICLE_DESCRIPTION =
  "How Find & Buy Agents move commerce from the street and the screen to autonomous protocols that discover supply, negotiate terms, and settle. FindBuyAgent.com.";

export const PUBLISHED = "2026-10-31";

export const HOME_TITLE = "Find & Buy Agent | FindBuyAgent.com";

export const HOME_DESCRIPTION =
  "Find & Buy Agent finds the same thing for less. Type it, paste a link, or upload a photo. Nothing is bought until you approve. FindBuyAgent.com.";

export const VAULT_TITLE = "Agent Vault | FindBuyAgent.com";

export const VAULT_DESCRIPTION =
  "Set the Find & Buy Agent wallet, spend caps, and delivery country before it pays. FindBuyAgent.com.";

export const ORDERS_TITLE = "Orders | FindBuyAgent.com";

export const ORDERS_DESCRIPTION =
  "Orders the Find & Buy Agent placed, with price, merchant, and delivery country. FindBuyAgent.com.";

export const BLOG_TITLE = "Blog: Visa Find & Buy Agentics | FindBuyAgent.com";

export const BLOG_DESCRIPTION =
  "Essays on the Visa model of Find & Buy Agentics, autonomous buying, and x402 crypto payment agents. The buy stays inside a mandate. FindBuyAgent.com.";

export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return `${ORIGIN}/`;
  return `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageHead(input: { title: string; description: string; path: string; type?: "website" | "article" }) {
  const url = absoluteUrl(input.path);
  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:type", content: input.type ?? "website" },
      { property: "og:site_name", content: "FindBuyAgent" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Find & Buy Agent" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${ORIGIN}/#organization`,
        name: "Find & Buy Agent",
        alternateName: ["FindBuyAgent", "FindBuyAgent.com"],
        url: `${ORIGIN}/`,
        logo: { "@type": "ImageObject", url: `${ORIGIN}/icon-512.png` },
      },
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}/#website`,
        url: `${ORIGIN}/`,
        name: "FindBuyAgent",
        alternateName: "Find & Buy Agent",
        description: HOME_DESCRIPTION,
        publisher: { "@id": `${ORIGIN}/#organization` },
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${ORIGIN}/?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${ORIGIN}/#app`,
        name: "Find & Buy Agent",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: `${ORIGIN}/`,
        description: HOME_DESCRIPTION,
        image: OG_IMAGE,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${ORIGIN}/#organization` },
      },
    ],
  };
}

export function articleJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${ARTICLE_URL}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": ARTICLE_URL },
        headline: ARTICLE_H1,
        description: ARTICLE_DESCRIPTION,
        datePublished: PUBLISHED,
        dateModified: PUBLISHED,
        inLanguage: "en",
        articleSection: "Commerce",
        keywords: [
          "Find & Buy Agent",
          "FindBuyAgent",
          "FindBuyAgent.com",
          "agentic commerce",
          "autonomous commerce",
          "Trusted Agent Protocol",
          "Universal Commerce Protocol",
        ].join(", "),
        image: [OG_IMAGE],
        author: { "@id": `${ORIGIN}/#organization` },
        publisher: { "@id": `${ORIGIN}/#organization` },
        isPartOf: { "@id": `${ORIGIN}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${ARTICLE_URL}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Find & Buy Agent", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${ORIGIN}/blog` },
          { "@type": "ListItem", position: 3, name: "Find & Buy Agents", item: ARTICLE_URL },
        ],
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
