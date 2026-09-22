import { notFound } from 'next/navigation';

import ApercuPertes from './contenu';

/**
 * Le registre des pertes et vols, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuPertes() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuPertes />;
}
