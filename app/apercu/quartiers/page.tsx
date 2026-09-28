import { notFound } from 'next/navigation';

import ApercuQuartiers from './contenu';

/**
 * Le rapprochement des quartiers, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuQuartiers() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuQuartiers />;
}
