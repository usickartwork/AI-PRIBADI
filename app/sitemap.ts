import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: "https://onemind.web.id/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://onemind.web.id/usick-one",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://onemind.web.id/harga",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://onemind.web.id/ai-chat",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://onemind.web.id/code-studio",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://onemind.web.id/music",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://onemind.web.id/privacy",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://onemind.web.id/terms",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
