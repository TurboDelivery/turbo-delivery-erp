import { notFound } from 'next/navigation';

import ApercuCreneaux from './contenu';

/**
 * La semaine des créneaux telle qu'elle est proposée, sur données d'exemple.
 *
 * <p>Sans authentification et sans serveur : la conception se regarde et se manipule avant
 * d'être appliquée à l'écran réel. C'est ce banc qui manquait quand un composant ajouté
 * sans y passer a fait tomber la page Tickets en production.</p>
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuCreneaux() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuCreneaux />;
}
