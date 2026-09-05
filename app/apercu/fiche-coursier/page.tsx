import { notFound } from 'next/navigation';

import ApercuFicheCoursier from './contenu';

/**
 * Les sections du formulaire de la fiche coursier, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuFicheCoursier() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuFicheCoursier />;
}
