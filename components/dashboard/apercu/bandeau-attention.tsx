'use client';

import { Chip } from '@heroui-v3/react';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

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

/** Les tons de l'ERP vers ceux de HeroUI v3. `accent` est réservé à l'action principale. */
const COULEUR = {
    critique: 'danger',
    attention: 'warning',
    calme: 'default',
} as const;

const ORDRE: Record<TonSignalement, number> = { critique: 0, attention: 1, calme: 2 };

/**
 * Ce qui demande une action, AVANT le reste du tableau de bord.
 *
 * <p>L'écran alignait une vingtaine de tuiles de poids visuel identique : les comptes en
 * attente de validation s'y lisaient exactement comme le nombre de partenaires actifs.
 * Rien ne disait à l'opérateur par où commencer, et un compteur qui appelle une action se
 * noyait parmi des compteurs purement informatifs.</p>
 *
 * <p>Bâti sur `Chip` de HeroUI v3 : la variante `soft` porte déjà le fond teinté, la
 * bordure et le contraste de texte de chaque couleur sémantique. Aucune classe de couleur
 * n'est écrite ici — c'est tout l'intérêt de la bibliothèque.</p>
 *
 * <p>Il ne déclenche AUCUNE requête : il consomme les données que l'écran charge déjà. Un
 * signalement dont le compte est nul n'apparaît pas — un bandeau qui affiche « 0 compte en
 * attente » réapprend à l'œil à ignorer le bandeau. Et quand il n'y a rien, il le dit en
 * une ligne discrète plutôt que de disparaître : une absence se confond avec un
 * chargement.</p>
 */
export default function BandeauAttention({
    signalements,
    etatInconnu = false,
}: {
    signalements: Signalement[];
    /**
     * Vrai quand une lecture a echoue : on ne SAIT pas s'il y a quelque chose a traiter.
     *
     * <p>Sans cela le bandeau annoncait « Rien ne demande d'action immediate » alors qu'une
     * requete venait d'echouer — il affirmait une absence qu'il ne pouvait pas constater.
     * Il se tait desormais, et l'echec est annonce une seule fois, la ou se trouve sa
     * relance.</p>
     */
    etatInconnu?: boolean;
}) {
    const actifs = signalements
        .filter((s) => s.nombre === undefined || s.nombre > 0)
        .sort((a, b) => ORDRE[a.ton] - ORDRE[b.ton]);

    if (etatInconnu) return null;

    if (actifs.length === 0) {
        return (
            <div className="mb-6 flex items-center gap-2 text-sm text-muted">
                <Check aria-hidden="true" className="size-4 text-success" />
                <span>Rien ne demande d&apos;action immédiate.</span>
            </div>
        );
    }

    return (
        <div aria-label="À traiter" className="mb-6 flex flex-wrap items-center gap-2.5" role="status">
            {actifs.map((s) => {
                const puce = (
                    <Chip color={COULEUR[s.ton]} size="lg" variant="soft">
                        <Chip.Label>
                            {s.nombre !== undefined && <b className="font-semibold tabular-nums">{s.nombre} </b>}
                            {s.libelle}
                        </Chip.Label>
                        {s.href && <ArrowRight aria-hidden="true" className="size-3.5 opacity-70" />}
                    </Chip>
                );

                // Un vrai lien, pas un bouton : l'opérateur doit pouvoir ouvrir la file
                // dans un onglet à côté sans quitter son tableau de bord.
                return s.href ? (
                    <Link
                        key={s.libelle}
                        className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        href={s.href}
                    >
                        {puce}
                    </Link>
                ) : (
                    <React.Fragment key={s.libelle}>{puce}</React.Fragment>
                );
            })}
        </div>
    );
}
