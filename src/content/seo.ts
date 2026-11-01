export const ORIGIN = "https://findbuyagent.com";

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

export function articleJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${ORIGIN}/#organization`,
        name: "Find & Buy Agent",
        alternateName: ["FindBuyAgent", "FindBuyAgent.com"],
        url: `${ORIGIN}/`,
        logo: {
          "@type": "ImageObject",
          url: `${ORIGIN}/favicon.svg`,
        },
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
      },
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
        image: [`${ORIGIN}/og.jpg`],
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

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${ORIGIN}/#organization`,
        name: "Find & Buy Agent",
        alternateName: ["FindBuyAgent", "FindBuyAgent.com"],
        url: `${ORIGIN}/`,
        logo: { "@type": "ImageObject", url: `${ORIGIN}/favicon.svg` },
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
      },
    ],
  };
}
