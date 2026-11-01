import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostView } from "@/components/findbuy/post-view";
import { AppHeader, JsonLd } from "@/components/findbuy/shell";
import { getPost } from "@/content/posts";
import { ORIGIN } from "@/content/seo";
import type { Post } from "@/content/posts/types";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    const post = loaderData as Post | undefined;
    if (!post) return { meta: [{ title: "Not found | FindBuyAgent.com" }] };
    const url = `${ORIGIN}/blog/${post.slug}`;
    return {
      meta: [
        { title: post.seoTitle },
        { name: "description", content: post.description },
        { name: "author", content: "FindBuyAgent" },
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.series },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: Missing,
  component: PostPage,
});

function postJsonLd(post: Post) {
  const url = `${ORIGIN}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "en",
    mainEntityOfPage: url,
    url,
    keywords: post.keywords.join(", "),
    articleSection: post.series,
    image: `${ORIGIN}/og.jpg`,
    author: { "@type": "Organization", name: "Find & Buy Agent", url: `${ORIGIN}/` },
    publisher: {
      "@type": "Organization",
      name: "Find & Buy Agent",
      url: `${ORIGIN}/`,
      logo: { "@type": "ImageObject", url: `${ORIGIN}/favicon.svg` },
    },
  };
}

function PostPage() {
  const post = Route.useLoaderData();
  return (
    <div className="app">
      <JsonLd data={postJsonLd(post)} />
      <AppHeader active="blog" />
      <main className="frame">
        <PostView post={post} />
      </main>
    </div>
  );
}

function Missing() {
  return (
    <div className="app">
      <AppHeader active="blog" />
      <main className="frame">
        <article className="essay">
          <h1>That essay is not on the blog.</h1>
          <p>
            <a href="/blog">Back to the blog</a>
          </p>
        </article>
      </main>
    </div>
  );
}
