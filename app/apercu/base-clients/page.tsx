import { notFound } from 'next/navigation';

import ApercuBaseClients from './contenu';

/**
 * La base clients, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuBaseClients() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuBaseClients />;
}
