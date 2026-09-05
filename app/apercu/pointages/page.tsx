import { notFound } from 'next/navigation';

import ApercuPointages from './contenu';

/**
 * La file d'arbitrage des pointages hors zone, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuPointages() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuPointages />;
}
