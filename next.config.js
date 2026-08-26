/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // On NE rend PAS le lint bloquant : le compteur est a 109 problemes, pas a zero,
    // et un build qui casse sur du lint pre-existant empeche de livrer un correctif.
    // Mais on ELARGIT ce qu'il regarde : par defaut `next lint` ignore `features/`,
    // soit 823 fichiers et 45 % du code, jamais lintes du tout. Les dependances de
    // hooks manquantes y sont la cause classique de donnees perimees a l'ecran.
    // Regle de conduite : mesurer le compteur, le geler, aucun lot ne doit le monter.
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'features', 'hooks', 'lib', 'src', 'utils', 'providers'],
  },

  // En-tetes de securite. Aucun n'exige d'arbitrage, et aucun ne change l'affichage.
  // `X-Frame-Options` est mis a SAMEORIGIN et non DENY comme le plan le proposait :
  // DENY interdirait aussi l'inclusion par l'ERP lui-meme, et rien ici ne le justifie.
  // La CSP en report-only reste a faire : elle demande de relever d'abord les sources
  // reellement chargees (Google Maps, la socket, ghcr), sinon elle bruite pour rien.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
  output: 'standalone', // Réactivé pour le build Docker
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
