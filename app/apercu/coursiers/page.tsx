import { notFound } from 'next/navigation';

import ApercuCoursiers from './contenu';

/**
 * La liste des coursiers, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuCoursiers() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuCoursiers />;
}
