import { ARTICLE_DESCRIPTION, ARTICLE_H1, ARTICLE_PATH, PUBLISHED } from "@/content/seo";
import { buyingPosts } from "./buying";
import type { Listing, Post, Series } from "./types";
import { visaPosts } from "./visa";
import { x402Posts } from "./x402";

export const posts: Post[] = [...visaPosts, ...x402Posts, ...buyingPosts];

const bySlug = new Map(posts.map((post) => [post.slug, post]));

export function getPost(slug: string): Post | undefined {
  return bySlug.get(slug);
}

const foundation: Listing = {
  slug: "find-and-buy-agents",
  path: ARTICLE_PATH,
  title: ARTICLE_H1,
  description: ARTICLE_DESCRIPTION,
  kicker: "Foundations",
  date: PUBLISHED,
  minutes: 18,
  series: "Foundations",
};

export function listings(): Listing[] {
  const dynamic: Listing[] = posts.map((post) => ({
    slug: post.slug,
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
    kicker: post.kicker,
    date: post.date,
    minutes: post.minutes,
    series: post.series,
    featured: post.featured,
  }));
  return [...dynamic, foundation].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function featuredListing(): Listing {
  return listings().find((item) => item.featured) ?? listings()[0];
}

export function listingsIn(series: Series): Listing[] {
  return listings().filter((item) => item.series === series && !item.featured);
}

export function relatedListings(slugs: string[]): Listing[] {
  const all = listings();
  return slugs.map((slug) => all.find((item) => item.slug === slug)).filter((item): item is Listing => Boolean(item));
}
