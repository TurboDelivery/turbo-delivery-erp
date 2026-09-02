'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

/** Gravité d'un signalement. Le ton n'est jamais décoratif : il dit quoi faire. */
export type TonSignalement = 'critique' | 'attention' | 'calme';

export interface Signalement {
    /** Ce qui ne va pas, en une phrase. Le nombre est passé à part pour être mis en avant. */
    libelle: string;
    /** Le compte concerné. Absent, le signalement est purement qualitatif. */
    nombre?: number;
    ton: TonSignalement;
    /** Où l'opérateur va pour traiter. Sans lien, le signalement informe sans appeler à agir. */
    href?: string;
}

const TON: Record<TonSignalement, { conteneur: string; pastille: string }> = {
    critique: { conteneur: 'border-danger/30 bg-danger-50 text-danger-700', pastille: 'bg-danger' },
    attention: { conteneur: 'border-warning/30 bg-warning-50 text-warning-700', pastille: 'bg-warning' },
    calme: { conteneur: 'border-default-200 bg-default-100 text-default-600', pastille: 'bg-default-400' },
};

const ORDRE: Record<TonSignalement, number> = { critique: 0, attention: 1, calme: 2 };

/**
 * Ce qui demande une action, AVANT le reste du tableau de bord.
 *
 * <p>L'écran alignait une vingtaine de tuiles de poids visuel identique : les comptes en
 * attente de validation s'y lisaient exactement comme le nombre de partenaires actifs.
 * Rien ne disait à l'opérateur par où commencer, et un compteur qui appelle une action se
 * noyait parmi des compteurs purement informatifs.</p>
 *
 * <p>Ce bandeau ne fait qu'une chose : remonter en tête ce sur quoi il faut agir, trié par
 * gravité. Il ne déclenche AUCUNE requête — il consomme les données que l'écran charge
 * déjà. Un signalement dont le compte est nul n'apparaît pas : un bandeau qui affiche
 * « 0 compte en attente » réapprend à l'œil à ignorer le bandeau.</p>
 *
 * <p>Quand il n'y a rien à signaler, il le dit en une ligne discrète plutôt que de
 * disparaître : une absence se confond avec un chargement.</p>
 */
export default function BandeauAttention({ signalements }: { signalements: Signalement[] }) {
    const actifs = signalements
        .filter((s) => s.nombre === undefined || s.nombre > 0)
        .sort((a, b) => ORDRE[a.ton] - ORDRE[b.ton]);

    if (actifs.length === 0) {
        return (
            <div className="mb-6 flex items-center gap-2 text-sm text-default-500">
                <Check className="size-4 text-success" aria-hidden="true" />
                <span>Rien ne demande d&apos;action immédiate.</span>
            </div>
        );
    }

    return (
        <div className="mb-6 flex flex-wrap items-center gap-2.5" role="status" aria-label="À traiter">
            {actifs.map((s) => {
                const ton = TON[s.ton];
                const contenu = (
                    <>
                        <span className={cn('size-1.5 shrink-0 rounded-full', ton.pastille)} aria-hidden="true" />
                        {s.nombre !== undefined && <b className="font-semibold tabular-nums">{s.nombre}</b>}
                        <span>{s.libelle}</span>
                        {s.href && <ArrowRight className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />}
                    </>
                );
                const classes = cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                    ton.conteneur,
                    s.href && 'transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2',
                );

                // Un vrai lien, pas un bouton : l'opérateur doit pouvoir ouvrir la file
                // dans un onglet a cote sans quitter son tableau de bord.
                return s.href ? (
                    <Link key={s.libelle} href={s.href} className={classes}>
                        {contenu}
                    </Link>
                ) : (
                    <span key={s.libelle} className={classes}>
                        {contenu}
                    </span>
                );
            })}
        </div>
    );
}

/** Icône exportée pour les écrans qui veulent annoncer la même chose sans le bandeau. */
export { AlertTriangle as IconeAttention };
