/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = { ...config.resolve.alias, pdfkit: false };
    }
    return config;
  },
};
module.exports = nextConfig;
