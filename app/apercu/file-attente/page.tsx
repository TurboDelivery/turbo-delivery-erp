import { notFound } from 'next/navigation';

import ApercuFileAttente from './contenu';

/**
 * L'écran de la file d'attente, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuFileAttente() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuFileAttente />;
}
