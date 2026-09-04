import { notFound } from 'next/navigation';

import GalerieComposants from './galerie';

/**
 * La galerie des composants de la bibliotheque, telle que le projet les emploie.
 *
 * <h3>Pourquoi cette page existe</h3>
 * <p>La page Tickets est tombee en production sur un `Tabs.Indicator` qui LEVE au rendu :
 * il rend un `SharedElement` exigeant un `SharedElementTransition` en ancetre. Ni `tsc`
 * ni le build ne pouvaient l'attraper — les types sont valides, le composant existe, et
 * l'exception ne survient qu'au rendu.</p>
 *
 * <p>Le banc `/apercu` aurait du le montrer, mais il ne rendait pas ce bloc. Une mesure
 * l'a confirme apres coup : SEPT composants employes dans 136 fichiers n'etaient rendus
 * nulle part avant d'arriver sur un ecran reel — `Modal` a lui seul dans soixante et un.</p>
 *
 * <p>Cette galerie rend UNE instance de chaque composant, avec l'anatomie exacte que le
 * projet utilise. Elle se charge sans authentification et sans donnee : si un composant
 * leve au rendu, la page tombe ici, sur un poste, et non sur l'ecran d'un operateur.</p>
 *
 * <p>Elle n'existe qu'en developpement. En production, la route n'existe pas.</p>
 */
export default function PageComposants() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <GalerieComposants />;
}
