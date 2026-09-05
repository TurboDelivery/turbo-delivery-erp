import { notFound } from 'next/navigation';

import ApercuReporting from './contenu';

/**
 * Les deux panneaux du reporting, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuReporting() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuReporting />;
}
