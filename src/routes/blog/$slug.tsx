import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostView } from "@/components/findbuy/post-view";
import { JsonLd } from "@/components/findbuy/shell";
import { SiteShell } from "@/components/shell/site-shell";
import { getPost } from "@/content/posts";
import { OG_IMAGE, ORIGIN, pageHead } from "@/content/seo";
import type { Post } from "@/content/posts/types";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => {
    const post = loaderData as Post | undefined;
    if (!post) {
      return pageHead({
        title: "Essay not found | FindBuyAgent.com",
        description: "That essay is not on the FindBuyAgent blog.",
        path: `/blog/${params.slug}`,
      });
    }
    const head = pageHead({
      title: post.seoTitle,
      description: post.description,
      path: `/blog/${post.slug}`,
      type: "article",
    });
    return {
      meta: [
        ...head.meta,
        { name: "author", content: "FindBuyAgent" },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.series },
      ],
      links: head.links,
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
    image: OG_IMAGE,
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
    <SiteShell>
      <JsonLd data={postJsonLd(post)} />
      <PostView post={post} />
    </SiteShell>
  );
}

function Missing() {
  return (
    <SiteShell>
      <article className="essay">
        <h1>That essay is not on the blog.</h1>
        <p>
          <a href="/blog">Back to the blog</a>
        </p>
      </article>
    </SiteShell>
  );
}
