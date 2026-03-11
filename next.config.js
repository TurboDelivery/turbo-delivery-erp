/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,

  },
  // output: 'standalone', // Temporairement désactivé pour résoudre les erreurs de symlinks Windows
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: 'erp-prod.turbodeliveryapp.com',
      },
      {
        protocol: "https",
        hostname: 'resto-prod.turbodeliveryapp.com',
      },
      {
        protocol: "https",
        hostname: 'customer-prod.turbodeliveryapp.com',
      },
      {
        protocol: "https",
        hostname: 'delivery-prod.turbodeliveryapp.com',
      },
      {
        protocol: "https",
        hostname: 'backend-prod.turbodeliveryapp.com',
      },
    ],
  },
};

module.exports = nextConfig;
