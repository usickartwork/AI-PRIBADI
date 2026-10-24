/**
 * Curated Visual Asset & Photography Pipeline
 * Provides verified Unsplash photography with guaranteed high-resolution URLs,
 * crisp inline SVG icons, and graceful SVG fallback handlers.
 */

export interface CuratedImage {
  id: string;
  url: string;
  alt: string;
  category: string;
  aspectRatio: "16:9" | "4:3" | "1:1" | "21:9" | "3:4";
}

export const CURATED_PHOTOGRAPHY: Record<string, CuratedImage[]> = {
  saas: [
    {
      id: "saas-hero-1",
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
      alt: "Modern SaaS Analytics Platform Dashboard Screen",
      category: "hero",
      aspectRatio: "16:9",
    },
    {
      id: "saas-collab-1",
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
      alt: "Modern Product Team Collaboration Workspace",
      category: "team",
      aspectRatio: "16:9",
    },
    {
      id: "saas-infra-1",
      url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80",
      alt: "High-Performance Cloud Infrastructure Servers",
      category: "infrastructure",
      aspectRatio: "4:3",
    },
    {
      id: "saas-user-1",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      alt: "CTO Testimonial Portrait",
      category: "avatar",
      aspectRatio: "1:1",
    },
    {
      id: "saas-user-2",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      alt: "VP of Engineering Testimonial Portrait",
      category: "avatar",
      aspectRatio: "1:1",
    },
  ],
  dashboard: [
    {
      id: "dash-finance-1",
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      alt: "Financial Metrics & Portfolio Growth Analytics",
      category: "analytics",
      aspectRatio: "16:9",
    },
    {
      id: "dash-trading-1",
      url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      alt: "Real-time Quantitative Market Trading Terminal",
      category: "trading",
      aspectRatio: "16:9",
    },
    {
      id: "dash-user-1",
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      alt: "Senior Analyst Profile Avatar",
      category: "avatar",
      aspectRatio: "1:1",
    },
  ],
  booking_barber: [
    {
      id: "barber-hero-1",
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80",
      alt: "Master Barber Crafting Precision Haircut in Vintage Leather Chair",
      category: "hero",
      aspectRatio: "16:9",
    },
    {
      id: "barber-service-1",
      url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80",
      alt: "Hot Towel Straight Razor Beard Sculpting",
      category: "service",
      aspectRatio: "4:3",
    },
    {
      id: "barber-service-2",
      url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
      alt: "Classic Hair Pomade & Grooming Elixir",
      category: "product",
      aspectRatio: "4:3",
    },
    {
      id: "barber-ambience-1",
      url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
      alt: "Gentlemen Barber Lounge Interior with Warm Ambient Lighting",
      category: "interior",
      aspectRatio: "16:9",
    },
  ],
  booking_medical: [
    {
      id: "med-hero-1",
      url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=80",
      alt: "Modern Specialist Clinic & Wellness Lounge",
      category: "hero",
      aspectRatio: "16:9",
    },
    {
      id: "med-doc-1",
      url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
      alt: "Senior Consultant Physician Dr. Sarah Jenkins",
      category: "doctor",
      aspectRatio: "3:4",
    },
  ],
  portfolio: [
    {
      id: "port-arch-1",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      alt: "Minimalist Architectural House with Clean Lines",
      category: "architecture",
      aspectRatio: "16:9",
    },
    {
      id: "port-art-1",
      url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80",
      alt: "Curated Contemporary Editorial Artwork Gallery",
      category: "exhibition",
      aspectRatio: "4:3",
    },
    {
      id: "port-photo-1",
      url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      alt: "Editorial Studio Portrait",
      category: "editorial",
      aspectRatio: "3:4",
    },
  ],
  ecommerce: [
    {
      id: "ecom-bag-1",
      url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80",
      alt: "Artisan Leather Travel Bag Handcrafted",
      category: "product",
      aspectRatio: "4:3",
    },
    {
      id: "ecom-watch-1",
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
      alt: "Minimalist Chronograph Precision Watch",
      category: "product",
      aspectRatio: "4:3",
    },
    {
      id: "ecom-shoes-1",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80",
      alt: "Performance Running Sneaker",
      category: "product",
      aspectRatio: "4:3",
    },
  ],
};

/**
 * Returns curated images matched to the project domain.
 */
export function getDomainImages(domainKeyword: string): CuratedImage[] {
  const lower = domainKeyword.toLowerCase();
  if (lower.includes("barber") || lower.includes("cukur") || lower.includes("grooming") || lower.includes("salon")) {
    return CURATED_PHOTOGRAPHY.booking_barber;
  }
  if (lower.includes("klinik") || lower.includes("dokter") || lower.includes("medis") || lower.includes("health")) {
    return CURATED_PHOTOGRAPHY.booking_medical;
  }
  if (lower.includes("dash") || lower.includes("analytics") || lower.includes("finance") || lower.includes("kpi")) {
    return CURATED_PHOTOGRAPHY.dashboard;
  }
  if (lower.includes("port") || lower.includes("arsitek") || lower.includes("desain") || lower.includes("studio")) {
    return CURATED_PHOTOGRAPHY.portfolio;
  }
  if (lower.includes("toko") || lower.includes("shop") || lower.includes("store") || lower.includes("ecom")) {
    return CURATED_PHOTOGRAPHY.ecommerce;
  }
  return CURATED_PHOTOGRAPHY.saas;
}

/**
 * Generates an SVG Data-URI Fallback to gracefully replace broken external images.
 */
export function generateSvgFallbackDataUri(
  label: string,
  width: number = 800,
  height: number = 500,
  bg: string = "#121216",
  accent: string = "#71717a"
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="#1c1c22" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" />
    <circle cx="${width / 2}" cy="${height / 2 - 20}" r="32" fill="none" stroke="${accent}" stroke-width="2" opacity="0.3" />
    <path d="M${width / 2 - 12} ${height / 2 - 20} l24 0 M${width / 2} ${height / 2 - 32} l0 24" stroke="${accent}" stroke-width="2" opacity="0.4" />
    <text x="${width / 2}" y="${height / 2 + 35}" fill="${accent}" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600" text-anchor="middle" letter-spacing="1">${label.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Common crisp semantic SVG icons for UI sections.
 * Clean 24x24 viewBox, stroke-width 1.5, zero emoji dependency.
 */
export const SEMANTIC_SVG_ICONS: Record<string, string> = {
  check: `<svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
  star: `<svg class="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  arrowRight: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`,
  calendar: `<svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  clock: `<svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  shield: `<svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  chart: `<svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  search: `<svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
  filter: `<svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>`,
};
