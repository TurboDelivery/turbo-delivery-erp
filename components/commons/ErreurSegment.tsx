'use client';

import { Button } from '@heroui-v3/react';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Filet d'erreur d'une SECTION de l'ERP, monte par les `error.tsx` de segment.
 *
 * <p>Avant, un seul `app/error.tsx` couvrait les 109 routes : la moindre erreur de rendu
 * remplacait la page entiere par un ecran 500 plein format, menu compris, et l'operateur
 * perdait sa navigation. Ici l'erreur reste contenue dans la zone de contenu.</p>
 *
 * <p>Le texte ne promet pas qu'une equipe a ete prevenue : personne ne l'est
 * automatiquement.</p>
 */

/**
 * Un morceau de code de l'application n'a pas pu etre telecharge.
 *
 * <p>Next decoupe l'application en fragments charges a la demande. Quand l'un d'eux
 * n'arrive pas — reseau coupe, proxy d'entreprise qui refuse, ou deploiement qui a
 * renomme les fichiers pendant que l'onglet etait ouvert — React leve `ChunkLoadError`.</p>
 *
 * <p>C'est une panne de TRANSPORT, pas un defaut de la page. Et elle empire toute seule :
 * une fois l'echec memorise, chaque navigation vers une route qui a besoin du meme
 * fragment retombe immediatement, sans nouvelle tentative reseau. L'ERP devenait donc
 * progressivement inutilisable, ecran apres ecran, et « Reessayer » n'y pouvait rien —
 * `reset()` refait le rendu, il ne retelecharge pas le fragment manquant.</p>
 */
function estErreurDeFragment(error: Error): boolean {
    return (
        error.name === 'ChunkLoadError' ||
        /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
            error.message ?? '',
        )
    );
}

/**
 * Une seule tentative automatique par session.
 *
 * <p>Si le rechargement ne suffit pas — le proxy est toujours coupe, le serveur toujours
 * injoignable — recharger encore boucle a l'infini sur un ecran blanc. On s'arrete donc
 * apres un essai et on rend la main, avec un texte qui nomme la vraie cause.</p>
 */
const CLE_TENTATIVE = 'erp:rechargement-fragment';

export default function ErreurSegment({
    section,
    error,
    reset,
}: {
    section: string;
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const fragment = estErreurDeFragment(error);
    const [rechargementEnCours, setRechargementEnCours] = useState(false);

    useEffect(() => {
        console.error(`[${section}]`, error);
    }, [section, error]);

    useEffect(() => {
        if (!fragment || typeof window === 'undefined') return;

        let dejaEssaye = false;
        try {
            dejaEssaye = window.sessionStorage.getItem(CLE_TENTATIVE) === '1';
            window.sessionStorage.setItem(CLE_TENTATIVE, '1');
        } catch {
            // Navigation privee ou stockage refuse : on ne recharge pas automatiquement
            // plutot que de risquer une boucle qu'on ne saurait pas arreter.
            return;
        }

        if (dejaEssaye) return;
        setRechargementEnCours(true);
        // `reload()` REDEMANDE le document et ses fragments ; `reset()` se contente de
        // refaire le rendu avec le meme code manquant.
        window.location.reload();
    }, [fragment]);

    // Une fois l'application chargee sans encombre, la tentative est oubliee : le prochain
    // incident, dans une heure ou dans une semaine, aura droit a son propre rechargement.
    useEffect(() => {
        if (fragment) return;
        try {
            window.sessionStorage.removeItem(CLE_TENTATIVE);
        } catch {
            /* sans consequence */
        }
    }, [fragment]);

    const rechargerMaintenant = () => {
        setRechargementEnCours(true);
        try {
            window.sessionStorage.removeItem(CLE_TENTATIVE);
        } catch {
            /* sans consequence */
        }
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-danger-200 bg-danger-50/40 p-10 text-center dark:border-danger-800 dark:bg-danger-900/10">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                    {fragment
                        ? 'Une partie de l’application n’a pas pu être téléchargée'
                        : `${section} n’a pas pu s’afficher`}
                </h2>
                <p className="max-w-md text-sm text-default-500">
                    {fragment
                        ? rechargementEnCours
                            ? 'Rechargement en cours…'
                            : 'Le rechargement automatique n’a pas suffi. Vérifiez la connexion — un proxy ou un VPN peut bloquer le téléchargement — puis réessayez.'
                        : 'Le reste de l’ERP fonctionne. Réessayez, et signalez-le si cela se répète.'}
                </p>
            </div>
            {/*
             * `onClick` sur un Button v3 est ignore EN SILENCE : c'est `onPress`. Le
             * bouton de RELANCE d'un ecran en erreur ne relancait donc rien — sur l'ecran
             * meme ou l'utilisateur n'a que ce bouton pour s'en sortir. Et « Reessayer »
             * n'est pas un geste dangereux : le rouge y disait le contraire.
             */}
            <Button
                isDisabled={rechargementEnCours}
                onPress={fragment ? rechargerMaintenant : reset}
                size="sm"
                variant="outline"
            >
                <RefreshCcw aria-hidden="true" className="size-4" />
                {fragment ? 'Recharger la page' : 'Réessayer'}
            </Button>
            {error.digest && <p className="text-xs text-muted">Référence : {error.digest}</p>}
        </div>
    );
}
