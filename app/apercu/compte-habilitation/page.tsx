import { notFound } from 'next/navigation';

import ApercuCompteHabilitation from './contenu';

/** Banc de l'onglet « Habilitation & pièces ». N'existe qu'en développement. */
export default function PageApercuCompteHabilitation() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuCompteHabilitation />;
}
