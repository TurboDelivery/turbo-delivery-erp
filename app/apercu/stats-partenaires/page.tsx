import { notFound } from 'next/navigation';

import ApercuStatsPartenaires from './contenu';

/**
 * Les statistiques par restaurant, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuStatsPartenaires() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuStatsPartenaires />;
}
