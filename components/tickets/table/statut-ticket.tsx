'use client';

import { Chip } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { StatutControle } from '@/types/statut-controle.enum';

/**
 * La pastille de statut d'un ticket.
 *
 * <h3>Pourquoi une couleur ecrite ici et pas un `variant`</h3>
 * <p>HeroUI v3 propose quatre variantes de `Chip` — primary, secondary, tertiary, soft —
 * et aucune echelle semantique a SIX crans. Or le controle d'un ticket a six etats qui
 * doivent se distinguer d'un coup d'oeil dans un tableau dense. La couleur est donc
 * fournie ici, faute d'equivalent dans la bibliotheque, et seulement pour cela.</p>
 *
 * <h3>Ce qui est corrige</h3>
 * <ul>
 *   <li>Les six couples etaient ecrits en `bg-*-100 text-*-700` SANS variante sombre :
 *       depuis que la bascule de theme est dans l'en-tete, ces pastilles s'affichaient en
 *       pastel clair sur fond sombre. Chaque etat a desormais son couple sombre.</li>
 *   <li>La couleur ne porte plus seule le sens : le LIBELLE est toujours ecrit. Une
 *       information qui ne tient qu'a la teinte est perdue pour un daltonien, et le parc
 *       en compte statistiquement un sur douze cote hommes.</li>
 * </ul>
 */

const ETATS: Record<StatutControle, { libelle: string; teinte: string }> = {
    [StatutControle.PENDING]: {
        libelle: 'En attente',
        teinte: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300',
    },
    [StatutControle.TARDIF]: {
        libelle: 'Tardif',
        teinte: 'bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-300',
    },
    [StatutControle.AUTHENTIFIE]: {
        libelle: 'Authentifié',
        teinte: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300',
    },
    [StatutControle.V1_VALIDE]: {
        libelle: 'V1 validé',
        teinte: 'bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300',
    },
    [StatutControle.V2_VALIDE]: {
        libelle: 'V2 validé',
        teinte: 'bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300',
    },
    [StatutControle.REJETE_FRAUDE]: {
        libelle: 'Rejeté (fraude)',
        teinte: 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-300',
    },
};

const INCONNU = { libelle: 'Inconnu', teinte: 'bg-surface-secondary text-muted' };

export function StatutTicket({ statut }: { statut?: string }) {
    const etat = ETATS[statut as StatutControle] ?? { ...INCONNU, libelle: statut ?? INCONNU.libelle };
    return (
        <Chip className={cn('whitespace-nowrap', etat.teinte)} size="sm" variant="soft">
            {etat.libelle}
        </Chip>
    );
}
