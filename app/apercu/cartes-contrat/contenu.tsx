'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { CartesContrat, type SyntheseContrat } from '@/features/performance/components/cartes-contrat';
import { formatMontant } from '@/utils/format.utils';

/**
 * Le banc des trois cartes de « Performance de la flotte ».
 *
 * <p>Ces cartes lisaient un recalcul des courses PAR DATE, en direct, pendant que le bandeau
 * juste au-dessus lisait la grille de paie figée. Supprimer un ticket d'une semaine clôturée
 * faisait donc baisser les cartes sans toucher au bandeau, et le même écran affichait deux
 * vérités sur la même semaine. Elles lisent désormais `parContrat`, servi par
 * `/api/creneaux/{id}/grille-paiement/stats`, c'est-à-dire la même source que le bandeau.</p>
 *
 * <p>Le jeu « clôturé » reprend les chiffres RÉELS relevés en production le 04/11/2026 sur le
 * créneau du 12 octobre, où la somme des livreurs des trois cartes tombe exactement sur le
 * total du bandeau. C'est le contrôle qui compte : des cartes qui ne se réconcilient pas avec
 * le bandeau sont le défaut qu'on vient de corriger.</p>
 */
const JEUX: Record<string, { libelle: string; syntheses: SyntheseContrat[]; aCategoriser: number; ticketsACategoriser: number; montantACategoriser: number }> = {
    cloture: {
        libelle: 'Clôturé (chiffres réels)',
        aCategoriser: 0,
        ticketsACategoriser: 0,
        montantACategoriser: 0,
        syntheses: [
            { contrat: 'JOURNALIER', livreurs: 24, programmes: 22, nbTickets: 909, commission: 814410, prime: 76100 },
            { contrat: 'INDEPENDANT', livreurs: 54, programmes: 0, nbTickets: 2596, commission: 3153300, prime: 354200 },
            { contrat: 'SUPERVISEUR_LIVREUR', livreurs: 6, programmes: 6, nbTickets: 46, commission: 34500, prime: 0 },
        ],
    },
    trou: {
        libelle: 'Avec des livreurs à catégoriser',
        aCategoriser: 3,
        ticketsACategoriser: 57,
        montantACategoriser: 68400,
        syntheses: [
            { contrat: 'JOURNALIER', livreurs: 24, programmes: 22, nbTickets: 909, commission: 814410, prime: 76100 },
            { contrat: 'INDEPENDANT', livreurs: 54, programmes: 0, nbTickets: 2596, commission: 3153300, prime: 354200 },
            { contrat: 'SUPERVISEUR_LIVREUR', livreurs: 6, programmes: 6, nbTickets: 46, commission: 34500, prime: 0 },
        ],
    },
    periode: {
        libelle: 'Période de plusieurs semaines',
        aCategoriser: 0,
        ticketsACategoriser: 0,
        montantACategoriser: 0,
        syntheses: [
            // `programmes` est NUL : un emploi du temps couvre une semaine, la question n'a pas
            // de réponse unique sur un mois. La carte doit montrer un tiret, pas un zéro.
            { contrat: 'JOURNALIER', livreurs: 28, programmes: null, nbTickets: 3651, commission: 3288600, prime: 298400 },
            { contrat: 'INDEPENDANT', livreurs: 159, programmes: null, nbTickets: 11204, commission: 10683800, prime: 1402900 },
            { contrat: 'SUPERVISEUR_LIVREUR', livreurs: 12, programmes: null, nbTickets: 193, commission: 144750, prime: 0 },
        ],
    },
    vide: {
        libelle: 'Semaine sans activité',
        aCategoriser: 0,
        ticketsACategoriser: 0,
        montantACategoriser: 0,
        syntheses: [
            { contrat: 'JOURNALIER', livreurs: 0, programmes: 0, nbTickets: 0, commission: 0, prime: 0 },
            { contrat: 'INDEPENDANT', livreurs: 0, programmes: 0, nbTickets: 0, commission: 0, prime: 0 },
            { contrat: 'SUPERVISEUR_LIVREUR', livreurs: 0, programmes: 0, nbTickets: 0, commission: 0, prime: 0 },
        ],
    },
};

/*
 * ⚠ Le thème bascule sur <html>, jamais sur une enveloppe : `styles/tailwind.css` déclare
 * encore les jetons shadcn en triplets HSL bruts dans la portée `.dark`, et sur un div
 * imbriqué c'est le triplet qui gagne, si bien que `bg-success` ne peint plus rien.
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

export default function ApercuCartesContrat() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('cloture');
    const [sombre, setSombre] = useThemeSombre();
    const courant = JEUX[jeu];

    const totalLivreurs = courant.syntheses.reduce((n, s) => n + s.livreurs, 0) + courant.aCategoriser;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                <span className="font-bold uppercase tracking-wider">Aperçu · Cartes par contrat</span>
                {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                    <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                        {JEUX[k].libelle}
                    </Button>
                ))}
                <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                    {sombre ? 'Clair' : 'Sombre'}
                </Button>
            </header>

            <div className="space-y-4 p-4">
                {/*
                  * Le bandeau est réduit à son seul chiffre utile ici : le contrôle du banc est
                  * que la somme des cartes tombe dessus. C'est ce rapprochement qui était faux.
                  */}
                <div className="rounded-large border border-default-200 bg-content1 p-5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-default-500">
                        Livreurs payés (grille de paie)
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{totalLivreurs}</p>
                    <p className="mt-1 text-xs text-muted">
                        La somme des cartes ci-dessous doit tomber exactement sur ce nombre.
                    </p>
                </div>

                <CartesContrat parametres={{ semaine: '2026-10-12' }} syntheses={courant.syntheses} />

                {courant.aCategoriser > 0 ? (
                    <p className="rounded-lg bg-warning-50 px-4 py-3 text-xs text-warning-700 dark:bg-warning-100/10">
                        {courant.aCategoriser} livreur{courant.aCategoriser > 1 ? 's' : ''} de ce créneau
                        {courant.aCategoriser > 1 ? ' ne portent' : ' ne porte'} aucun type de contrat en base
                        et {courant.aCategoriser > 1 ? 'ne figurent' : 'ne figure'} donc dans aucune des trois
                        cartes, pour {formatMontant(courant.montantACategoriser)} et{' '}
                        {courant.ticketsACategoriser} livraison{courant.ticketsACategoriser > 1 ? 's' : ''}. Le
                        type se pose sur la fiche du livreur.
                    </p>
                ) : null}
            </div>
        </div>
    );
}
