'use client';

import { Skeleton } from '@/components/heroui';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Couleur du chiffre et de la pastille. Jetons HeroUI uniquement : pas
 * d'hexadécimal, pas de classe de palette brute, pour que le retour du mode
 * sombre ne demande aucune retouche.
 */
export type TonStat = 'neutre' | 'primaire' | 'succes' | 'attention' | 'danger';

const CHIFFRE: Record<TonStat, string> = {
    neutre: 'text-default-900',
    primaire: 'text-primary',
    succes: 'text-success',
    attention: 'text-warning',
    danger: 'text-danger',
};

const PASTILLE: Record<TonStat, string> = {
    neutre: 'bg-default-100 text-default-600',
    primaire: 'bg-primary/10 text-primary',
    succes: 'bg-success/10 text-success',
    attention: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
};

const SURFACE_ACCENT: Record<TonStat, string> = {
    neutre: 'border-default-300 bg-default-100',
    primaire: 'border-primary/30 bg-primary/5',
    succes: 'border-success/30 bg-success/5',
    attention: 'border-warning/30 bg-warning/5',
    danger: 'border-danger/30 bg-danger/5',
};

export interface CarteStatProps {
    /** Ce que la carte compte. La carte le met en capitales, ne pas les écrire. */
    libelle: string;
    /** Le chiffre, DÉJÀ formaté par l'appelant : formatFcfa(n), formatNombre(n), `${taux} %`. */
    valeur: React.ReactNode;
    /** Troisième ligne : ce que le chiffre veut dire. Une ligne, sans point final. */
    note?: string;
    /**
     * Icône dans une pastille à droite du libellé.
     *
     * <p>Accepte un composant lucide (`icone={Coins}`), la forme à préférer, ou un
     * élément déjà rendu (`icone={<Coins />}`) pour les appelants qui reçoivent leur
     * icône en prop et ne peuvent pas la passer autrement.</p>
     */
    icone?: LucideIcon | React.ReactElement;
    /** Couleur du chiffre. `neutre` par défaut : un chiffre n'est pas coloré sans raison. */
    ton?: TonStat;
    /** Carte mise en avant : la surface prend la teinte du ton. Une par bandeau au plus. */
    accent?: boolean;
    /** Remplace le chiffre par un squelette. Le libellé et la note restent lisibles. */
    isLoading?: boolean;
    /** Rend la carte cliquable : vrai <button>, aria-pressed, focus visible. */
    onClick?: () => void;
    /** Filtre appliqué : anneau de sélection. N'a de sens qu'avec `onClick`. */
    estActif?: boolean;
    /** Compteur de nouveautés, en haut à droite. Masqué si absent ou nul. */
    badge?: number;
    /** Échappatoire pour un élément propre à une seule carte. Un deuxième usage = une vraie prop. */
    children?: React.ReactNode;
    className?: string;
}

/**
 * Carte de statistique unique de l'ERP.
 *
 * <p>Remplace 17 implémentations qui divergeaient sur l'ombre, l'arrondi, la taille
 * du chiffre, le squelette de chargement et la façon d'exprimer une couleur. Toutes
 * les couleurs passent par des jetons : le mode sombre est masqué aujourd'hui, il
 * reviendra, et aucune retouche ne doit être nécessaire ce jour-là.</p>
 *
 * <p>Ce que la carte ne fait PAS : formater un montant (l'appelant le fait, elle ne
 * peut pas deviner l'unité) et afficher une erreur (une carte seule ressemblerait à
 * un zéro, l'échec se traite au niveau du bandeau avec `EtatErreur`).</p>
 */
export default function CarteStat({
    libelle,
    valeur,
    note,
    icone: Icone,
    ton = 'neutre',
    accent = false,
    isLoading = false,
    onClick,
    estActif = false,
    badge,
    children,
    className,
}: CarteStatProps) {
    const cliquable = typeof onClick === 'function';

    const habillage = cn(
        'rounded-large border p-4 text-left transition-colors',
        accent ? SURFACE_ACCENT[ton] : 'border-default-200 bg-content1',
        cliquable &&
            'cursor-pointer hover:border-default-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40',
        estActif && 'border-default-900 ring-1 ring-default-900',
        className,
    );

    const contenu = (
        <>
            <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-default-500">
                    {libelle}
                </p>
                {(Icone || (badge != null && badge > 0)) && (
                    <div className="flex shrink-0 items-center gap-1.5">
                        {badge != null && badge > 0 && (
                            <span className="inline-flex items-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                +{badge}
                            </span>
                        )}
                        {Icone && (
                            <span
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-medium [&_svg]:h-4 [&_svg]:w-4',
                                    PASTILLE[ton],
                                )}
                            >
                                {/* NE PAS tester `typeof === 'function'` ici : les icones
                                    lucide sont des `forwardRef`, donc des OBJETS
                                    `{$$typeof, render, displayName}` et non des fonctions.
                                    Ce test les envoyait dans la branche « element deja
                                    rendu », React recevait l'objet comme enfant et levait
                                    l'erreur #31, qui fait tomber la page ENTIERE. Constate
                                    en production le 26/08/2026 sur l'ecran Tickets.
                                    `isValidElement` est le seul test correct. */}
                                {React.isValidElement(Icone)
                                    ? Icone
                                    : React.createElement(Icone as LucideIcon, {
                                          className: 'h-4 w-4',
                                          'aria-hidden': true,
                                      })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {isLoading ? (
                <Skeleton className="mt-2 h-7 w-24 rounded-medium" />
            ) : (
                <p
                    className={cn(
                        'mt-2 text-xl font-semibold leading-none tabular-nums tracking-tight sm:text-2xl',
                        CHIFFRE[ton],
                    )}
                >
                    {valeur}
                </p>
            )}

            {note && <p className="mt-1.5 text-[11px] leading-tight text-default-400">{note}</p>}

            {children}
        </>
    );

    if (cliquable) {
        return (
            <button type="button" onClick={onClick} aria-pressed={estActif} className={habillage}>
                {contenu}
            </button>
        );
    }

    return <div className={habillage}>{contenu}</div>;
}

/**
 * La grille des bandeaux de statistiques.
 *
 * <p>Elle existe parce que les 15 bandeaux actuels utilisent 13 grilles différentes,
 * avec trois valeurs de gap, et que l'un d'eux met 4 cartes dans 3 colonnes.</p>
 */
export function GrilleStats({
    colonnes = 4,
    children,
    className,
}: {
    /** Nombre de cartes du bandeau. Détermine les points de rupture. */
    colonnes?: 2 | 3 | 4 | 5;
    children: React.ReactNode;
    className?: string;
}) {
    const RUPTURES: Record<2 | 3 | 4 | 5, string> = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    };

    return <div className={cn('grid gap-3', RUPTURES[colonnes], className)}>{children}</div>;
}