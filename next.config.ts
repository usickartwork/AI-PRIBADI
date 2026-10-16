import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@clerk/nextjs"],
  },
};

export default nextConfig;

