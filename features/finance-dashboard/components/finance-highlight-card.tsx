import { Card } from '@heroui-v3/react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { cn } from '@/lib/utils';

interface FinanceHighlightCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    tone: 'red' | 'orange' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'green';
    href?: string;
    ariaLabel?: string;
    children?: React.ReactNode;
}

/*
 * Le montant etait ecrit en `text-<teinte>-500` sur `bg-<teinte>-200/50`. Mesure au
 * canvas sur le fond effectif de chaque tuile : de 1,68:1 (jaune) a 3,39:1 (violet),
 * quand un texte de 20 px non gras demande 4,5:1. La teinte reste celle de la tuile,
 * seule la nuance descend jusqu'a la premiere qui franchit le seuil — elle differe
 * d'une teinte a l'autre parce que les teintes n'ont pas la meme clarte.
 */
const toneClasses: Record<
    FinanceHighlightCardProps['tone'],
    { container: string; iconBox: string; icon: string; value: string }
> = {
    red: {
        container: 'bg-red-200/50',
        iconBox: 'bg-red-300/40',
        icon: 'text-red-700',
        value: 'text-red-700',   // 5,10:1 sur bg-red-200/50
    },
    orange: {
        container: 'bg-orange-200/50',
        iconBox: 'bg-orange-300/40',
        icon: 'text-orange-700',
        value: 'text-orange-800',   // 6,06:1 sur bg-orange-200/50
    },
    blue: {
        container: 'bg-blue-200/50',
        iconBox: 'bg-blue-300/40',
        icon: 'text-blue-700',
        value: 'text-blue-700',   // 5,49:1 sur bg-blue-200/50
    },
    yellow: {
        container: 'bg-yellow-200/50',
        iconBox: 'bg-yellow-300/40',
        icon: 'text-yellow-700',
        value: 'text-yellow-800',   // 6,03:1 sur bg-yellow-200/50
    },
    purple: {
        container: 'bg-purple-200/50',
        iconBox: 'bg-purple-300/40',
        icon: 'text-purple-700',
        value: 'text-purple-700',   // 5,81:1 sur bg-purple-200/50
    },
    indigo: {
        container: 'bg-indigo-200/50',
        iconBox: 'bg-indigo-300/40',
        icon: 'text-indigo-700',
        value: 'text-indigo-700',   // 6,35:1 sur bg-indigo-200/50
    },
    green: {
        container: 'bg-green-200/50',
        iconBox: 'bg-green-300/40',
        icon: 'text-green-700',
        value: 'text-green-800',   // 6,17:1 sur bg-green-200/50
    },
};

export default function FinanceHighlightCard({
    title,
    value,
    icon: Icon,
    tone,
    href,
    ariaLabel,
    children,
}: FinanceHighlightCardProps) {
    const style = toneClasses[tone];

    const content = (
        <>
            <div className="flex gap-2">
                <div className={cn('rounded-xl p-4', style.iconBox)}>
                    <Icon className={cn('size-6', style.icon)} />
                </div>
                <div>
                    {/* Pas `text-muted` ici : ce gris est calibre pour les surfaces neutres et ne
                        donne que 3,79:1 a 4,26:1 sur les fonds teintes des tuiles. `text-gray-600`
                        tient 5,93:1 au pire cas tout en restant nettement plus clair que le
                        montant, qui garde la hierarchie. Le fond de la tuile etant une pastel
                        fixe, un gris fixe est le bon choix dans les deux themes. */}
                    <h4 className="text-medium mb-2 text-gray-600 2xl:text-lg">{title}</h4>
                    <span className={cn('text-xl 2xl:text-2xl', style.value)}>{value}</span>
                </div>
            </div>
            {children}
        </>
    );

    // `Card` v3 est une colonne flex par defaut ; la tuile se lit en ligne des `md`,
    // d'ou le `md:flex-row` explicite que le `flex` nu portait implicitement avant.
    const carte = (
        <Card
            className={cn(
                'w-full justify-between gap-4 rounded-xl px-4 py-5 max-md:flex-col md:flex-row md:items-center',
                style.container,
                href && 'h-full transition-all hover:shadow-md',
            )}
            variant="transparent"
        >
            {content}
        </Card>
    );

    if (href) {
        return (
            <Link
                aria-label={ariaLabel ?? title}
                className="block h-full rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
                href={href}
            >
                {carte}
            </Link>
        );
    }

    return carte;
}
