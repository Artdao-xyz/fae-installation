import type { NextConfig } from "next";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.60"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.media.strapiapp.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

function withOptionalBundleAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== "true") return config;
  try {
    const bundleAnalyzer = require("@next/bundle-analyzer") as (
      options: { enabled: boolean },
    ) => (cfg: NextConfig) => NextConfig;
    return bundleAnalyzer({ enabled: true })(config);
  } catch {
    return config;
  }
}

export default withOptionalBundleAnalyzer(nextConfig);
