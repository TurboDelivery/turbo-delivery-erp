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

  /**
   * Un import inexistant doit FAIRE ECHOUER le build.
   *
   * <p>Le 27/08/2026, `components/heroui/index.ts` reexportait `CalendarDate` depuis
   * `@heroui/react`, qui ne l'exporte pas. webpack classe ce cas en WARNING : `tsc`
   * restait a 0, `pnpm build` affichait « Compiled successfully », la CI passait au
   * vert, et le defaut ne se manifestait qu'a l'execution en production. Le travail
   * d'une nuit a ete annule pour ca, et mon premier correctif a rate la cible parce
   * que rien, nulle part, ne pointait le symbole fautif.</p>
   *
   * <p>On promeut donc en ERREUR la famille de warnings « export X was not found /
   * attempted import error ». C'est volontairement etroit : ces messages designent
   * TOUJOURS un symbole qui n'existe pas, jamais un choix de style. Les autres
   * warnings restent des warnings.</p>
   */
  webpack: (config) => {
    const IMPORT_INTROUVABLE = /was not found in|Attempted import error/;
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.afterEmit.tap('EchouerSurImportIntrouvable', (compilation) => {
          const fautifs = compilation.warnings.filter((w) =>
            IMPORT_INTROUVABLE.test(w?.message ?? String(w)),
          );
          if (fautifs.length === 0) return;
          // Deplaces dans `errors` : webpack fait alors sortir le build en code non nul.
          compilation.warnings = compilation.warnings.filter((w) => !fautifs.includes(w));
          for (const f of fautifs) {
            f.message = `Import introuvable (promu en erreur, cf. next.config.js) :\n${f.message}`;
            compilation.errors.push(f);
          }
        });
      },
    });
    return config;
  },
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
