import type { Metadata } from 'next';

import { PointagesAValiderContent } from './content';

export const metadata: Metadata = {
  title: 'Pointages à valider',
};

/**
 * Arbitrage des pointages HORS-ZONE (règle owner 2026-07-31) : un livreur qui
 * pointe loin de son poste ne se justifie plus lui-même — l'équipe tranche ici.
 */
export default function PointagesAValiderPage() {
  return <PointagesAValiderContent />;
}
