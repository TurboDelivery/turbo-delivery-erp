import { Card } from '@heroui-v3/react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Ecart, type SensHausse } from '@/components/commons/ecart';
import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * Carte d'indicateur : un chiffre, ce qu'il vaut par rapport a la periode precedente,
 * et une phrase qui le situe.
 *
 * <h3>Ce qui change par rapport aux tuiles precedentes</h3>
 * <p>Les tuiles d'origine posaient un montant dans un fond pastel, avec une icone dans
 * un carre de la meme teinte. Sept teintes differentes sur un ecran, sans qu'aucune ne
 * distingue quoi que ce soit : la couleur decorait au lieu de dire.</p>
 *
 * <p>Ici la couleur ne sert qu'a une chose : le TON de l'ecart, qui suit ce qu'une hausse
 * veut dire pour cette grandeur. Le fond reste neutre. Et la troisieme ligne — « le mois
 * vient de commencer », « 100 % du CA du mois » — repond a la question qu'un chiffre seul
 * laisse ouverte : est-ce beaucoup ?</p>
 */

export interface CarteIndicateurProps {
    libelle: string;
    valeur: number;
    /** Valeur de la periode precedente. Absente = pas d'ecart affiche. */
    reference?: number;
    sens?: SensHausse;
    libelleReference?: string;
    /** Ce qui situe le chiffre : une part, un rappel, une alerte. */
    contexte?: string;
    /** `attention` teinte la ligne de contexte quand elle signale un probleme. */
    tonContexte?: 'neutre' | 'attention' | 'favorable';
    icone?: LucideIcon;
    href?: string;
    /** Met la carte en avant : c'est le chiffre qui porte l'ecran. */
    principal?: boolean;
}

const TON_CONTEXTE: Record<NonNullable<CarteIndicateurProps['tonContexte']>, string> = {
    neutre: 'text-muted',
    attention: 'text-red-800 dark:text-red-400',
    favorable: 'text-green-800 dark:text-green-400',
};

export function CarteIndicateur({
    libelle,
    valeur,
    reference,
    sens = 'neutre',
    libelleReference,
    contexte,
    tonContexte = 'neutre',
    icone: Icone,
    href,
    principal = false,
}: CarteIndicateurProps) {
    const negatif = valeur < 0;
    // `Intl` rend le signe avec un trait d'union, etroit et facile a manquer.
    const texte = formatCFA(valeur).replace(/^[-−]/, '−');

    const contenu = (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                    {libelle}
                </span>
                {Icone && <Icone aria-hidden="true" className="size-4 shrink-0 text-muted" />}
            </div>

            <p
                className={cn(
                    'mt-1.5 font-bold tabular-nums',
                    principal ? 'text-3xl' : 'text-2xl',
                    negatif && 'text-red-800 dark:text-red-400',
                )}
            >
                {texte}
            </p>

            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <Ecart
                    libelleReference={libelleReference}
                    reference={reference}
                    sens={sens}
                    valeur={valeur}
                />
                {contexte && <span className={cn('text-xs', TON_CONTEXTE[tonContexte])}>{contexte}</span>}
            </div>
        </>
    );

    const carte = (
        <Card className={cn('h-full gap-0 p-4', href && 'transition-shadow hover:shadow-md')}>
            {contenu}
        </Card>
    );

    if (!href) return carte;

    return (
        <Link
            className="block h-full rounded-3xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            href={href}
        >
            {carte}
        </Link>
    );
}
