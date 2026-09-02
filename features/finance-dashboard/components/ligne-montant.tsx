'use client';

import { Separator } from '@heroui-v3/react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Sens d'un montant. `neutre` par défaut : un chiffre n'est pas coloré sans raison.
 * La couleur ne sert qu'à dire ce qui entre, ce qui sort, ce qui alerte.
 */
export type SensMontant = 'neutre' | 'entree' | 'sortie' | 'alerte';

const TON: Record<SensMontant, string> = {
    neutre: 'text-foreground',
    entree: 'text-success',
    sortie: 'text-danger',
    alerte: 'text-warning',
};

export interface LigneMontantProps {
    libelle: string;
    valeur: string;
    /** Ce que le chiffre veut dire, quand le libellé ne suffit pas. Une ligne, sans point final. */
    note?: string;
    sens?: SensMontant;
    /** Décale la ligne : elle détaille celle du dessus au lieu de s'y ajouter. */
    detail?: boolean;
    /** Page de détail. Sans lien, la ligne informe sans appeler à agir. */
    href?: string;
    /** Trait de séparation au-dessus, pour les lignes de total. */
    separateur?: boolean;
}

/**
 * Une ligne d'état financier : libellé à gauche, montant aligné à droite.
 *
 * <p>Le tableau de bord présentait ces quatorze montants en TUILES colorées — sept teintes
 * de fond, sans rapport avec ce que le chiffre raconte, toutes de même poids visuel. On ne
 * pouvait ni les comparer (chiffres non alignés), ni voir lequel comptait, ni distinguer
 * une entrée d'une sortie autrement qu'en lisant le libellé.</p>
 *
 * <p>Un état financier se lit en colonnes. Les montants sont donc alignés en chasse
 * tabulaire, les composantes decalées sous leur total, et la couleur ne dit plus qu'une
 * chose : le sens du flux.</p>
 */
export default function LigneMontant({
    libelle,
    valeur,
    note,
    sens = 'neutre',
    detail = false,
    href,
    separateur = false,
}: LigneMontantProps) {
    const contenu = (
        <>
            <span className="flex min-w-0 flex-col">
                <span className={cn('truncate', detail ? 'text-[13px] text-muted' : 'text-sm text-foreground')}>
                    {libelle}
                </span>
                {note && <span className="truncate text-xs text-muted">{note}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1">
                <span
                    className={cn(
                        'tabular-nums',
                        detail ? 'text-[13px] font-medium' : 'text-sm font-semibold',
                        TON[sens],
                    )}
                >
                    {valeur}
                </span>
                {href && <ChevronRight aria-hidden="true" className="size-3.5 text-muted" />}
            </span>
        </>
    );

    const classes = cn(
        'flex items-baseline justify-between gap-4 py-2',
        detail && 'ps-4',
        href &&
            'rounded-md transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    );

    return (
        <>
            {separateur && <Separator className="my-1" variant="secondary" />}
            {href ? (
                // Un vrai lien : le drill-down doit s'ouvrir dans un onglet a cote.
                <Link className={cn(classes, 'px-2 -mx-2')} href={href}>
                    {contenu}
                </Link>
            ) : (
                <div className={classes}>{contenu}</div>
            )}
        </>
    );
}
