import { notFound } from 'next/navigation';

import ApercuComptePartenaire from './contenu';

/** Banc de la section « Compte du partenaire », dans ses trois états. N'existe qu'en développement. */
export default function PageApercuComptePartenaire() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuComptePartenaire />;
}
