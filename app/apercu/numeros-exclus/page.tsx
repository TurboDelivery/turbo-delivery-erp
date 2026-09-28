import { notFound } from 'next/navigation';

import ApercuNumerosExclus from './contenu';

/**
 * Les numéros exclus, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuNumerosExclus() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuNumerosExclus />;
}
