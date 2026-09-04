'use client';

import { Button, Card, Spinner } from '@heroui-v3/react';
import { ArrowRight, Download, Receipt, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import CommissionBadge from './commission-badge';

interface CACardProps {
    title: string;
    totalAmount: number;
    fraisLivraison: number;
    commissions: number;
    isLoading: boolean;
    isLoadingExport?: boolean;
    onDownload?: () => void;
    commissionFixe?: number;
    commissionPourcentage?: number;
    detailHref?: string;
}

/*
 * Pas de `variant="transparent"` ici : cette variante pose `--tw-border-style: none`,
 * et l'utilitaire `border` lit precisement cette variable pour son `border-style`.
 * La bordure demandee dans la classe etait donc calculee a `none 0px` — mesure a
 * l'ecran. La variante par defaut garde la bordure ET l'ombre qu'avait la carte
 * shadcn d'origine ; le fond de surface qu'elle ajoute est recouvert par le fond
 * explicite pose juste a cote.
 */
const CARTE = 'p-6 border border-green-200 bg-linear-to-r from-green-50 to-green-100';

export default function CACard({
    title,
    totalAmount,
    fraisLivraison,
    commissions,
    commissionFixe = 0,
    commissionPourcentage = 0,
    isLoading,
    isLoadingExport = false,
    onDownload,
    detailHref,
}: CACardProps) {
    const commissionItems = [
        { label: 'Commission fixe', amount: commissionFixe },
        { label: 'Commission pourcentage', amount: commissionPourcentage },
    ];

    if (isLoading) {
        return (
            <Card className={CARTE}>
                <div className="flex items-stretch gap-6 max-lg:flex-col">
                    <div className="flex flex-col justify-center gap-3 lg:w-[34%] lg:shrink-0">
                        <div className="h-5 w-32 animate-pulse rounded bg-green-200" />
                        <div className="h-9 w-48 animate-pulse rounded bg-green-200" />
                        <div className="h-8 w-40 animate-pulse rounded bg-green-200" />
                    </div>
                    <div className="hidden w-px self-stretch bg-green-200 lg:block" />
                    <div className="block h-px w-full bg-green-200 lg:hidden" />
                    <div className="grid flex-1 grid-cols-1 content-center gap-3 sm:grid-cols-2">
                        <div className="h-16 animate-pulse rounded-xl bg-surface/60" />
                        <div className="h-16 animate-pulse rounded-xl bg-surface/60" />
                        <div className="h-8 animate-pulse rounded bg-green-200/60 sm:col-span-2" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={CARTE}>
            <div className="flex items-stretch gap-6 max-lg:flex-col">
                {/* Partie 1 : CA (hero) — colonne fixe à gauche */}
                <div className="flex flex-col justify-center gap-3 lg:w-[34%] lg:shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-xl bg-green-200/70 p-2.5 text-green-700">
                            <Wallet className="size-5" />
                        </div>
                        <h3 className="text-medium font-medium text-muted 2xl:text-lg">{title}</h3>
                    </div>
                    {/* Une fleche verte montante accompagnait ce montant. Aucune variation
                        n'est calculee ni recue — `CACardProps` ne porte ni periode
                        precedente ni tendance — donc elle pointait vers le haut meme
                        quand le chiffre d'affaires s'effondrait. Un signal constant qui
                        se fait passer pour une mesure vaut moins que pas de signal. */}
                    <p className="text-3xl font-bold text-green-600 2xl:text-4xl">{formatCFA(totalAmount)}</p>
                    {onDownload && (
                        <Button
                            className="mt-1 w-fit gap-2 bg-green-600 text-xs font-medium text-white hover:bg-green-700 pressed:bg-green-800 disabled:bg-green-400"
                            isPending={isLoadingExport}
                            onPress={onDownload}
                            size="sm"
                        >
                            {({ isPending }: { isPending: boolean }) =>
                                isPending ? (
                                    <>
                                        <Spinner color="current" size="sm" />
                                        Téléchargement...
                                    </>
                                ) : (
                                    <>
                                        <Download className="size-3" />
                                        Télécharger les détails
                                    </>
                                )
                            }
                        </Button>
                    )}
                    {detailHref && (
                        <Link
                            className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-green-700 hover:underline"
                            href={detailHref}
                        >
                            Voir le détail
                            <ArrowRight className="size-3" />
                        </Link>
                    )}
                </div>

                {/* Séparateur */}
                <div className="hidden w-px self-stretch bg-green-200 lg:block" />
                <div className="block h-px w-full bg-green-200 lg:hidden" />

                {/* Partie 2 : Décomposition du CA — remplit la largeur restante */}
                <div className="grid flex-1 grid-cols-1 content-center gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3">
                        <div className="shrink-0 rounded-full bg-blue-100 p-2">
                            <Receipt className="size-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-sm text-muted">Frais Livraison</span>
                            <span className="block truncate text-lg font-bold text-blue-600 2xl:text-xl">
                                {formatCFA(fraisLivraison)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3">
                        <div className="shrink-0 rounded-full bg-purple-100 p-2">
                            <TrendingUp className="size-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-sm text-muted">Commissions</span>
                            <span className="block truncate text-lg font-bold text-purple-600 2xl:text-xl">
                                {formatCFA(commissions)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                        {commissionItems.map((item) => (
                            <CommissionBadge amount={item.amount} key={item.label} label={item.label} />
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
