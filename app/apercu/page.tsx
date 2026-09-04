import { notFound } from 'next/navigation';

import ApercuContenu from './contenu';

/**
 * Route de prevalisation du tableau de bord, hors authentification.
 *
 * <p>Toutes les regressions visuelles de ce projet ont ete trouvees par un humain qui
 * regardait l'ecran. Les ecrans concernes vivent derriere `app/(protected)/`, dont le
 * layout exige une session : sans identifiants, ils sont invisibles, et le seul moyen de
 * verifier une mise en page etait de demander une capture.</p>
 *
 * <p>Cette page rend les memes composants avec un jeu d'exemple, sans session et sans le
 * moindre appel reseau. Elle permet de voir l'ecran dans les etats qu'on oublie de
 * regarder : la periode vide, le deficit, les valeurs extremes, le chargement, l'echec.</p>
 *
 * <p>Elle n'existe qu'en developpement : en production la route repond 404. Aucune donnee
 * reelle ne la traverse.</p>
 */
export default function Page() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuContenu />;
}
