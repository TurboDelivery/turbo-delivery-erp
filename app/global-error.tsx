'use client';

import { useEffect } from 'react';

/**
 * Ecran de dernier recours : il remplace TOUT l'arbre, y compris le layout racine.
 *
 * <h3>Aucune dependance</h3>
 * <p>Il importait `framer-motion` et le `Button` de la bibliotheque. Or c'est l'ecran qui
 * s'affiche quand le rendu a echoue : si la panne vient d'une de ces dependances, la
 * page d'erreur tombe a son tour et l'utilisateur n'a plus qu'un ecran blanc. Un dernier
 * recours ne peut pas dependre de ce qui a pu le declencher — d'ou du balisage nu et des
 * styles en ligne, qui tiennent meme si la feuille de styles ne s'est pas chargee.</p>
 *
 * <h3>Rien ne tourne</h3>
 * <p>Un anneau tournait en boucle a cote du « 500 », et le bouton portait une fleche
 * circulaire : deux formes en rotation sur un ecran dont le message est precisement que
 * plus rien n'avance. Une animation perpetuelle dit « patientez, ca charge » — ici c'est
 * faux, et cela retient l'utilisateur au lieu de l'inviter a agir.</p>
 */
/**
 * Un morceau de code de l'application n'a pas pu etre telecharge.
 *
 * <p>Next decoupe l'application en fragments charges a la demande. Quand l'un d'eux
 * n'arrive pas — reseau coupe, proxy qui refuse, ou deploiement qui a renomme les
 * fichiers pendant que l'onglet etait ouvert — React leve `ChunkLoadError`.</p>
 *
 * <p>C'est ici que ca finit, et c'est le pire endroit : le fragment qui manque est
 * souvent celui de la limite d'erreur de la page elle-meme. La page tombe, son ecran
 * d'erreur ne peut pas se charger non plus, et tout l'arbre est remplace par un 500
 * plein format — menu compris. L'operateur perd sa navigation et n'a plus aucun moyen
 * de s'en sortir, puisque `reset()` refait le rendu avec le meme code manquant.</p>
 */
function estErreurDeFragment(error: Error): boolean {
    return (
        error.name === 'ChunkLoadError' ||
        /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
            error.message ?? '',
        )
    );
}

/** Une seule tentative par session : recharger en boucle sur un reseau coupe est pire. */
const CLE_TENTATIVE = 'erp:rechargement-fragment';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const fragment = estErreurDeFragment(error);

    useEffect(() => {
        console.error(error);
    }, [error]);

    useEffect(() => {
        if (!fragment || typeof window === 'undefined') return;
        let dejaEssaye = false;
        try {
            dejaEssaye = window.sessionStorage.getItem(CLE_TENTATIVE) === '1';
            window.sessionStorage.setItem(CLE_TENTATIVE, '1');
        } catch {
            // Stockage refuse : on ne recharge pas automatiquement plutot que de risquer
            // une boucle qu'on ne saurait pas arreter.
            return;
        }
        if (dejaEssaye) return;
        // `reload()` REDEMANDE le document et ses fragments ; `reset()` se contente de
        // refaire le rendu avec le meme code manquant.
        window.location.reload();
    }, [fragment]);

    return (
        <html lang="fr">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem 1rem',
                    background: '#f7f7f8',
                    color: '#18181b',
                    fontFamily:
                        'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
            >
                <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#71717a',
                        }}
                    >
                        {fragment ? 'Téléchargement interrompu' : 'Erreur 500'}
                    </p>

                    <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', lineHeight: 1.3 }}>
                        {fragment
                            ? 'Une partie de l’application n’a pas pu être téléchargée'
                            : 'L’application n’a pas pu afficher cette page'}
                    </h1>

                    <p style={{ margin: '0.75rem 0 0', lineHeight: 1.55, color: '#52525b' }}>
                        {fragment
                            ? 'Le rechargement automatique n’a pas suffi. Vérifiez la connexion — un proxy ou un VPN peut bloquer le téléchargement — puis rechargez. Votre session reste ouverte.'
                            : 'Rien n’a été perdu et votre session reste ouverte. Réessayez ; si cela se reproduit, signalez-le en indiquant le code ci-dessous.'}
                    </p>

                    <button
                        onClick={() => {
                            if (!fragment) {
                                reset();
                                return;
                            }
                            try {
                                window.sessionStorage.removeItem(CLE_TENTATIVE);
                            } catch {
                                /* sans consequence */
                            }
                            window.location.reload();
                        }}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            background: '#e11900',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                        }}
                        type="button"
                    >
                        {fragment ? 'Recharger la page' : 'Réessayer'}
                    </button>

                    {error.digest && (
                        <p
                            style={{
                                margin: '1.5rem 0 0',
                                fontSize: '0.8rem',
                                color: '#71717a',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            }}
                        >
                            Code : {error.digest}
                        </p>
                    )}
                </main>
            </body>
        </html>
    );
}
