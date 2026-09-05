import { notFound } from 'next/navigation';

import ApercuProgrammes from './contenu';

/**
 * La semaine des programmes hebdomadaires, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuProgrammes() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuProgrammes />;
}
