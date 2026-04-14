import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NextAuth v4 uses cookies()/headers() synchronously — Next.js 15 requires
  // these to be treated as external so the async restriction is not applied.
  serverExternalPackages: ["next-auth", "@auth/prisma-adapter"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
        {
        protocol: "https",
        hostname: "*.r2.dev", // Cloudflare R2 public bucket URLs
      },
         {
        protocol: 'https',
        hostname: 'pub-soma-lite-app.r2.dev',
      },
    ],
  },
};

export default nextConfig;
