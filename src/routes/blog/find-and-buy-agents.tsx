import { createFileRoute } from "@tanstack/react-router";
import { AgoraEssay } from "@/components/findbuy/agora-essay";
import { AppHeader, JsonLd } from "@/components/findbuy/shell";
import { ARTICLE_DESCRIPTION, ARTICLE_TITLE, ARTICLE_URL, PUBLISHED, articleJsonLd } from "@/content/seo";

export const Route = createFileRoute("/blog/find-and-buy-agents")({
  head: () => ({
    meta: [
      { title: ARTICLE_TITLE },
      { name: "description", content: ARTICLE_DESCRIPTION },
      { name: "author", content: "FindBuyAgent" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "article:published_time", content: PUBLISHED },
      { property: "article:modified_time", content: PUBLISHED },
      { property: "article:section", content: "Commerce" },
    ],
    links: [{ rel: "canonical", href: ARTICLE_URL }],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <div className="app">
      <JsonLd data={articleJsonLd()} />
      <AppHeader active="blog" />
      <main className="frame">
        <AgoraEssay />
      </main>
    </div>
  );
}
