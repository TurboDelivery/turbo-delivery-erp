import { notFound } from 'next/navigation';

import ApercuRecouvrement from './contenu';

/**
 * La chaîne de recouvrement, sur données d'exemple.
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuRecouvrement() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuRecouvrement />;
}
