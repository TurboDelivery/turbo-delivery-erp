import { Separator } from '@heroui-v3/react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * Le perimetre de l'activite, sur une seule ligne.
 *
 * <p>Ces huit effectifs occupaient cinq CARTES pleine hauteur en tete d'ecran, chacune
 * avec son titre en rouge, son chiffre en 30 px et son « Voir le detail » — soit environ
 * 240 px de haut pour cinq nombres a deux chiffres, avant le moindre element financier.
 * Le premier regard tombait donc sur le nombre de partenaires, ce que personne n'ouvre
 * l'ERP pour savoir.</p>
 *
 * <p>Ce sont des constantes de contexte : on les consulte une fois, on ne les surveille
 * pas. Leur forme naturelle est une bande de reperes, pas une grille de cartes. Elles
 * gardent leurs huit valeurs, leurs cinq liens et leurs trois sous-populations — mais
 * elles cessent d'occuper la place de ce qu'on vient reellement lire.</p>
 */

export interface RepereBande {
    cle: string;
    libelle: string;
    valeur: number | null;
    href?: string;
    /** Sous-populations, rendues sous le compteur. */
    details?: { libelle: string; valeur: number | null; href: string }[];
    /** Repere qui appelle un geste : il porte l'accent, les autres non. */
    appelleAction?: boolean;
}

interface BandePerimetreProps {
    reperes: RepereBande[];
    className?: string;
}

function Nombre({ valeur }: { valeur: number | null }) {
    if (valeur === null) return <span className="text-base text-muted">—</span>;
    return (
        <span className="text-lg font-semibold tabular-nums">
            {new Intl.NumberFormat('fr-FR').format(valeur)}
        </span>
    );
}

export function BandePerimetre({ reperes, className }: BandePerimetreProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-separator bg-surface px-4 py-2.5',
                className,
            )}
        >
            {reperes.map((r, i) => {
                // Libelle ET nombre sur la meme ligne : empiles, la bande faisait 141 px
                // a 720 px de large — mesure — au lieu des 56 px d'une bande de reperes.
                const corps = (
                    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                        <span className="text-[11px] uppercase tracking-[0.06em] text-muted">{r.libelle}</span>
                        <Nombre valeur={r.valeur} />
                        {r.href && (
                            <ChevronRight
                                aria-hidden="true"
                                className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                            />
                        )}
                    </span>
                );

                return (
                    <div className="flex items-center gap-4" key={r.cle}>
                        {i > 0 && <Separator className="h-5 self-center" orientation="vertical" />}
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            {r.href ? (
                                <Link
                                    className={cn(
                                        'group rounded-sm hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent',
                                        // L'accent est reserve a ce qui attend un geste.
                                        r.appelleAction && r.valeur ? 'text-accent' : '',
                                    )}
                                    href={r.href}
                                >
                                    {corps}
                                </Link>
                            ) : (
                                corps
                            )}

                            {r.details && r.details.length > 0 && (
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                                    {r.details.map((d, j) => (
                                        <span className="flex items-center gap-2" key={d.libelle}>
                                            {j > 0 && <span aria-hidden="true">·</span>}
                                            <Link
                                                className="rounded-sm tabular-nums hover:text-foreground hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                                                href={d.href}
                                            >
                                                {d.libelle} {d.valeur ?? '—'}
                                            </Link>
                                        </span>
                                    ))}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
