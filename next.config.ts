import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/view", destination: "/v", permanent: true }];
  },
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

export default nextConfig;
