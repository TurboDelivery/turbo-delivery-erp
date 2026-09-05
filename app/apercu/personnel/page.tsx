import { notFound } from 'next/navigation';

import ApercuPersonnel from './contenu';

/**
 * Le vocabulaire du module Personnel, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuPersonnel() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuPersonnel />;
}
