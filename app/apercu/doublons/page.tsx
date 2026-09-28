import { notFound } from 'next/navigation';

import ApercuDoublons from './contenu';

/**
 * Les doublons et les fusions, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuDoublons() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuDoublons />;
}
