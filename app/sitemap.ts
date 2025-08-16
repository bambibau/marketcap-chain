// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://marketcap-chain.vercel.app/", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://marketcap-chain.vercel.app/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://marketcap-chain.vercel.app/privacy", lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];
}
