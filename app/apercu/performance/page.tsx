import { notFound } from 'next/navigation';

import ApercuPerformance from './contenu';

/**
 * L'état de performance hebdomadaire tel qu'il est proposé, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuPerformance() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuPerformance />;
}
