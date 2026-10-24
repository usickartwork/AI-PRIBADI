import type { ProjectItem } from "../CodeWorkspace";
import { getDomainImages, CuratedImage, generateSvgFallbackDataUri } from "./assetLibrary";

export type WebsiteDomain =
  | "saas"
  | "dashboard"
  | "portfolio"
  | "booking"
  | "marketplace"
  | "brand"
  | "ecommerce"
  | "editorial";

export type VisualArchetype =
  | "clean-modern-saas"
  | "hyper-dense-fintech"
  | "warm-editorial"
  | "minimalist-luxury"
  | "bold-futuristic"
  | "vibrant-creator";

export interface DesignPlan {
  domain: WebsiteDomain;
  visualArchetype: VisualArchetype;
  productGoal: string;
  targetAudience: string;
  typography: {
    primaryFont: string;
    headingFont: string;
    fontImportUrl: string;
    displayScale: string;
    h1Scale: string;
    h2Scale: string;
    h3Scale: string;
    bodyScale: string;
  };
  colorPalette: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    primary: string;
    accent: string;
    text: string;
    mutedText: string;
  };
  layoutStrategy: {
    heroType:
      | "split-preview"
      | "centered-statement"
      | "booking-card-lead"
      | "analytics-ribbon"
      | "editorial-showcase";
    containerMax: string;
    cardRadius: string;
    sectionSequence: string[];
  };
  interactiveSpec: {
    primaryInteractions: string[];
    hasModal: boolean;
    hasDynamicCalculation: boolean;
    hasFilterTabs: boolean;
  };
  curatedImages: CuratedImage[];
  fallbackImageUri: string;
}

/**
 * Synthesizes an Art Direction Design Plan prior to website code generation.
 * Eliminates generic templates by determining domain-tailored visual hierarchy,
 * bespoke typography, purposeful layout sequence, and verified photography.
 */
export function synthesizeDesignPlan(project: ProjectItem): DesignPlan {
  const combined = `${project.title} ${project.description || ""} ${project.prd?.overview || ""} ${project.userFlow || ""}`.toLowerCase();

  // 1. Domain Detection
  let domain: WebsiteDomain = "saas";
  if (
    combined.includes("cukur") ||
    combined.includes("barber") ||
    combined.includes("booking") ||
    combined.includes("reservasi") ||
    combined.includes("jadwal") ||
    combined.includes("klinik") ||
    combined.includes("dokter") ||
    combined.includes("salon") ||
    combined.includes("lapangan") ||
    combined.includes("futsal") ||
    combined.includes("appointment")
  ) {
    domain = "booking";
  } else if (
    combined.includes("dashboard") ||
    combined.includes("analytics") ||
    combined.includes("kpi") ||
    combined.includes("finance") ||
    combined.includes("trading") ||
    combined.includes("metric") ||
    combined.includes("manajemen") ||
    combined.includes("admin") ||
    combined.includes("stat")
  ) {
    domain = "dashboard";
  } else if (
    combined.includes("portfolio") ||
    combined.includes("portofolio") ||
    combined.includes("arsitek") ||
    combined.includes("fotografer") ||
    combined.includes("karya") ||
    combined.includes("gallery") ||
    combined.includes("studio")
  ) {
    domain = "portfolio";
  } else if (
    combined.includes("toko") ||
    combined.includes("shop") ||
    combined.includes("store") ||
    combined.includes("produk fisik") ||
    combined.includes("katalog") ||
    combined.includes("checkout") ||
    combined.includes("cart")
  ) {
    domain = "ecommerce";
  } else if (
    combined.includes("marketplace") ||
    combined.includes("jual beli") ||
    combined.includes("listing") ||
    combined.includes("penjual")
  ) {
    domain = "marketplace";
  }

  // 2. Visual Archetype & Styling Selection
  let archetype: VisualArchetype = "clean-modern-saas";
  let primaryFont = "Plus Jakarta Sans, sans-serif";
  let headingFont = "Plus Jakarta Sans, sans-serif";
  let fontImportUrl =
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap";

  let bg = "#090d16";
  let surface = "#111420";
  let surfaceElevated = "#171c2b";
  let border = "rgba(255, 255, 255, 0.08)";
  let primary = "#ffffff";
  let accent = "#38bdf8";
  let text = "#f8fafc";
  let muted = "#94a3b8";

  let heroType: DesignPlan["layoutStrategy"]["heroType"] = "split-preview";
  let cardRadius = "rounded-2xl";
  let sectionSequence: string[] = [];

  if (domain === "booking") {
    archetype = combined.includes("barber") || combined.includes("grooming")
      ? "minimalist-luxury"
      : "clean-modern-saas";
    primaryFont = "Plus Jakarta Sans, sans-serif";
    headingFont = "Plus Jakarta Sans, sans-serif";
    bg = "#0c0d10";
    surface = "#14151a";
    surfaceElevated = "#1d1e26";
    border = "rgba(255, 255, 255, 0.1)";
    primary = "#ffffff";
    accent = "#e4e4e7";
    text = "#fafafa";
    muted = "#a1a1aa";
    heroType = "booking-card-lead";
    cardRadius = "rounded-3xl";
    sectionSequence = [
      "Navigation Bar with Operating Hours Badge",
      "Lead Hero with Instant Booking Trigger",
      "Interactive Service Catalog with Real Prices in IDR",
      "Dynamic Date & Time Slot Matrix",
      "Floating or Sticky Order Calculation Bar",
      "Working Confirmation Modal with Booking Code",
      "Verified Customer Reviews",
      "Footer with Location Map & Social Links",
    ];
  } else if (domain === "dashboard") {
    archetype = "hyper-dense-fintech";
    primaryFont = "Inter, sans-serif";
    headingFont = "Inter, sans-serif";
    fontImportUrl =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";
    bg = "#080a10";
    surface = "#0e111a";
    surfaceElevated = "#151926";
    border = "rgba(255, 255, 255, 0.07)";
    primary = "#60a5fa";
    accent = "#38bdf8";
    text = "#f1f5f9";
    muted = "#94a3b8";
    heroType = "analytics-ribbon";
    cardRadius = "rounded-xl";
    sectionSequence = [
      "Top Command Header with Real-time Status & Search",
      "KPI Metric Stat Ribbon (4 Cards with Delta Badges & Sparkline)",
      "Interactive Trend Chart (SVG / Canvas Visualization)",
      "Filterable Entity & Transaction Table with Status Pills",
      "Quick Action Panel & Modal",
      "System Health & Recent Activity Log",
    ];
  } else if (domain === "portfolio") {
    archetype = "warm-editorial";
    primaryFont = "Plus Jakarta Sans, sans-serif";
    headingFont = "Playfair Display, serif";
    fontImportUrl =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
    bg = "#0d0c0a";
    surface = "#161512";
    surfaceElevated = "#201e1a";
    border = "rgba(255, 255, 255, 0.1)";
    primary = "#fafaf9";
    accent = "#d97706";
    text = "#fafaf9";
    muted = "#a8a29e";
    heroType = "editorial-showcase";
    cardRadius = "rounded-2xl";
    sectionSequence = [
      "Minimalist Top Header with Brand Mark",
      "Editorial Typography Hero with Statement Headline",
      "Curated Project Exhibition Grid with Hover Depth",
      "Creative Philosophy & Process Storytelling",
      "Client Recognition List & Selected Awards",
      "Contact Inquiry Drawer & Colophon Footer",
    ];
  } else {
    // SaaS Standard
    archetype = "clean-modern-saas";
    heroType = "split-preview";
    cardRadius = "rounded-3xl";
    sectionSequence = [
      "Glassmorphic Navbar with Live App CTA",
      "Split-Screen Hero with Interactive Live UI Mockup",
      "Trusted By / Metric Social Proof Bar",
      "Product-Led Feature Walkthrough (Asymmetric Layouts)",
      "Interactive Feature Comparison or Tab Showcase",
      "Transparent Pricing Matrix with Annual Discount Toggle",
      "Executive Testimonials with Verified Badges",
      "High-Conversion Final Action Callout",
      "Multi-Column Sitemap Footer",
    ];
  }

  const curatedImages = getDomainImages(combined);
  const fallbackImageUri = generateSvgFallbackDataUri(
    project.title || "Visual Preview",
    800,
    500,
    surface,
    accent
  );

  return {
    domain,
    visualArchetype: archetype,
    productGoal: project.prd?.goals?.join(", ") || "Memberikan pengalaman digital berstandar industri",
    targetAudience: project.prd?.targetUsers?.join(", ") || "Pengguna modern & profesional",
    typography: {
      primaryFont,
      headingFont,
      fontImportUrl,
      displayScale: "text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight",
      h1Scale: "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight",
      h2Scale: "text-2xl sm:text-3xl font-bold tracking-tight",
      h3Scale: "text-lg sm:text-xl font-semibold",
      bodyScale: "text-sm sm:text-base leading-relaxed text-zinc-300",
    },
    colorPalette: {
      background: bg,
      surface,
      surfaceElevated,
      border,
      primary,
      accent,
      text,
      mutedText: muted,
    },
    layoutStrategy: {
      heroType,
      containerMax: domain === "dashboard" ? "max-w-7xl" : "max-w-6xl",
      cardRadius,
      sectionSequence,
    },
    interactiveSpec: {
      primaryInteractions: [
        "Filter / category active tabs switcher",
        "Functional dynamic calculation / status change",
        "Smooth dialog / detail modal with backdrop dismissal",
        "Form validation with simulated feedback toast",
      ],
      hasModal: true,
      hasDynamicCalculation: domain === "booking" || domain === "ecommerce" || domain === "dashboard",
      hasFilterTabs: true,
    },
    curatedImages,
    fallbackImageUri,
  };
}

/**
 * Builds a rigorous, authoritative Art Direction System Prompt based on the Design Plan.
 */
export function buildArtDirectionSystemPrompt(plan: DesignPlan): string {
  const imageManifest = plan.curatedImages
    .slice(0, 4)
    .map((img, i) => `  * Foto ${i + 1} (${img.category}): "${img.url}" (Alt: "${img.alt}")`)
    .join("\n");

  return `You are a World-Class Creative Director and Principal UI/UX Architect creating an award-winning web product.
You do NOT produce cookie-cutter, generic templates. You craft bespoke, visually stunning, production-ready interfaces.

ART DIRECTION PLAN FOR THIS APPLICATION:
* DOMAIN: ${plan.domain.toUpperCase()}
* VISUAL ARCHETYPE: ${plan.visualArchetype}
* GOAL: ${plan.productGoal}
* TARGET AUDIENCE: ${plan.targetAudience}

TYPOGRAPHY & BRAND TOKENS:
* Google Fonts: <link href="${plan.typography.fontImportUrl}" rel="stylesheet">
* Primary Font: ${plan.typography.primaryFont}
* Heading Font: ${plan.typography.headingFont}
* Color Palette:
  - Background: ${plan.colorPalette.background} (Use class or inline style)
  - Surface Cards: ${plan.colorPalette.surface}
  - Surface Elevated: ${plan.colorPalette.surfaceElevated}
  - Border: ${plan.colorPalette.border}
  - Text: ${plan.colorPalette.text}
  - Muted: ${plan.colorPalette.mutedText}
  - Accent: ${plan.colorPalette.accent}
* Container: ${plan.layoutStrategy.containerMax} mx-auto px-4 sm:px-6
* Card Corner Radius: ${plan.layoutStrategy.cardRadius}

SECTION ARCHITECTURE & STORYTELLING SEQUENCE:
${plan.layoutStrategy.sectionSequence.map((s, i) => `${i + 1}. ${s}`).join("\n")}

STRICT VISUAL ANTI-PATTERNS (DO NOT VIOLATE):
1. NO REPETITIVE 3-CARD BOXES: Never default to three identical floating cards with 1-sentence text. Use asymmetric split layouts, data ribbons, z-pattern feature deep dives, or bento compositions.
2. NO GENERIC PURPLE GRADIENT BLOBS: Do not throw generic radial gradients everywhere. Use intentional architectural borders (1px border), subtle glassmorphism (backdrop-blur-md), and solid confident surfaces.
3. NO EMOJIS AS ICONS: Never use 🚀, 💻, 💡, 🔥 as feature icons. Use clean, professional inline SVGs with stroke-width="1.8" and stroke="currentColor".
4. REALISTIC CONTENT ONLY (ZERO LOREM IPSUM): Use real Indonesian context where applicable (e.g., Rupiah 'Rp85.000', WIB, realistic names, legitimate feature descriptions).
5. CURATED PHOTOGRAPHY WITH FALLBACKS:
  Use these verified high-resolution images:
${imageManifest}
  Always add: onerror="this.src='${plan.fallbackImageUri}'" to every <img> tag.

RICH JAVASCRIPT STATE & INTERACTION REQUIREMENTS:
Inside a clean <script> tag at the bottom of <body>:
* Filter Tabs: Category buttons must dynamically filter list items smoothly.
* Dynamic Totals: For booking/cart/pricing, clicking service/plan items must compute live total amounts immediately on the screen.
* Modals: Must open smoothly, display selected item data, and close via backdrop click or close button.
* Form Validations: Form submit must validate required fields, show simulated spinner (400ms), and display a sleek confirmation toast.

OUTPUT REQUIREMENT:
Output ONLY complete, valid <!DOCTYPE html><html>...</html> code inside a single \`\`\`html ... \`\`\` markdown block.
Include <!-- AI_GENERATED_PROTOTYPE --> inside <head>.`;
}
