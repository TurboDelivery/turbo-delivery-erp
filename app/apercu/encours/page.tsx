import { notFound } from 'next/navigation';

import ApercuEncours from './contenu';

/**
 * Le relevé des restes à payer, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuEncours() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuEncours />;
}
