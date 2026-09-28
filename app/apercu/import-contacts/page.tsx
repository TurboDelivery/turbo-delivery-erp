import { notFound } from 'next/navigation';

import ApercuImportContacts from './contenu';

/**
 * L'import de contacts, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuImportContacts() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuImportContacts />;
}
