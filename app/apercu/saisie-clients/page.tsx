import { notFound } from 'next/navigation';

import ApercuSaisieClients from './contenu';

/**
 * La grille de saisie en lot, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuSaisieClients() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuSaisieClients />;
}
