'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import type {
    FileAttenteKpis,
    PosteFileVue,
} from '@/app/(protected)/file-attente/hooks/use-file-attente-vue';
import { VueFileAttente } from '@/features/file-attente/refonte/vue-file-attente';

/** Le banc de la file d'attente : quatre jeux d'essai, deux thèmes, trois états. */

const RESTOS = [
    'Chez Paul, Cocody', 'Le Bistrot, Plateau', 'Kfc Marcory', 'La Villa, Riviera',
    'Pizza Roma, Zone 4', 'Grill du Port, Treichville', 'Le Wafou, Marcory',
];

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou', 'OUATTARA Lassina', 'DIALLO Mamadou',
];

const CONTRATS = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT'];

/** Un instant de référence FIXE : deux rendus doivent afficher la même attente. */
const MAINTENANT = new Date('2026-09-05T11:20:00').getTime();

/** Reproductible : deux rendus doivent montrer la même chose. */
function fabriquer(graine: number, nbPostes: number, tousDeserts: boolean): PosteFileVue[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    const postes = Array.from({ length: nbPostes }).map((_, i) => {
        const taille = tousDeserts ? 0 : Math.floor(suivant() * 10);
        const file = Array.from({ length: taille }).map((__, r) => ({
            avatar: undefined,
            cle: `f${i}-${r}`,
            entreeLe: new Date(MAINTENANT - Math.round(suivant() * 9000) * 1000),
            livreurId: `l${(i + r) % NOMS.length}`,
            nomComplet: NOMS[(i + r) % NOMS.length],
            rang: r + 1,
            typeContrat: suivant() < 0.75 ? CONTRATS[(i + r) % CONTRATS.length] : undefined,
        }));
        return {
            desert: file.length === 0,
            file,
            livreursAssignes: 2 + Math.floor(suivant() * 12),
            restaurant: RESTOS[i % RESTOS.length],
            restaurantId: `r${i}`,
        } satisfies PosteFileVue;
    });
    // Les postes déserts en premier : c'est la règle de l'écran.
    return [...postes].sort((a, b) => Number(b.desert) - Number(a.desert));
}

function kpisDe(postes: PosteFileVue[], commandes: number | null): FileAttenteKpis {
    return {
        commandesEnAttente: commandes,
        livreursEnFile: postes.reduce((n, p) => n + p.file.length, 0),
        postesDeserts: postes.filter((p) => p.desert).length,
        postesPourvus: postes.filter((p) => !p.desert).length,
    };
}

const JEUX = {
    ordinaire: { commandes: 3, libelle: 'Journée ordinaire', postes: fabriquer(11, 7, false) },
    deserts: { commandes: 14, libelle: 'Tous les postes déserts', postes: fabriquer(23, 6, true) },
    longue: { commandes: 0, libelle: 'Files longues', postes: fabriquer(53, 5, false) },
    vide: { commandes: null, libelle: 'Aucun poste', postes: [] as PosteFileVue[] },
};

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne — `bg-success` ne peint alors plus rien.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
    const [sombre, setSombre] = React.useState(false);
    React.useEffect(() => {
        const html = document.documentElement;
        const avant = html.className;
        html.className = sombre ? 'dark' : 'light';
        return () => {
            html.className = avant;
        };
    }, [sombre]);
    return [sombre, setSombre];
}

export default function ApercuFileAttente() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec' | 'partiel'>('normal');
    const [sombre, setSombre] = useThemeSombre();

    const postes = JEUX[jeu].postes;

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · File d’attente</span>
                    {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                        <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                            {JEUX[k].libelle}
                        </Button>
                    ))}
                    <span className="mx-1 h-4 w-px bg-separator" />
                    {(['normal', 'chargement', 'echec', 'partiel'] as const).map((e) => (
                        <Button key={e} onPress={() => setEtat(e)} size="sm" variant={etat === e ? 'secondary' : 'ghost'}>
                            {e}
                        </Button>
                    ))}
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                <main className="mx-auto max-w-[1600px] p-4">
                    <VueFileAttente
                        isError={etat === 'echec'}
                        isFetching={false}
                        isLoading={etat === 'chargement'}
                        kpis={kpisDe(postes, JEUX[jeu].commandes)}
                        maintenant={MAINTENANT}
                        postes={postes}
                        rafraichir={async () => undefined}
                        universeIncomplet={etat === 'partiel'}
                    />
                </main>
            </div>
        </div>
    );
}
