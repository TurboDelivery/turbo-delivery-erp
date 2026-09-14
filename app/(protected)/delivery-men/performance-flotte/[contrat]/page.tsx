import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AvertissementListeTronquee } from '@/components/commons/AvertissementListeTronquee';
import UserListPerformanceBird from '@/components/dashboard/delivery-men/performance/user-list-performance-bird';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { SelecteurSemaine } from '@/features/performance/components/selecteur-semaine';
import { semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import type { TurboyType } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { getPerformanceParContrat } from '@/src/performance/performance-flotte.action';

export const metadata: Metadata = {
    title: 'PERFORMANCE PAR CATÉGORIE',
    description: 'Performance des livreurs d\'une catégorie de contrat',
};

/**
 * Les trois seules valeurs acceptées.
 *
 * <p>Un contrat inconnu dans l'URL rend un 404 plutôt qu'une liste vide : une liste vide se
 * lirait « aucun livreur dans cette catégorie », ce qui serait faux — la catégorie n'existe
 * pas. Le serveur, lui, refuserait la valeur avec une erreur technique illisible.</p>
 */
const CONTRATS: TurboyType[] = ['JOURNALIER', 'INDEPENDANT', 'SUPERVISEUR_LIVREUR'];

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ contrat: string }>;
    searchParams: Promise<{ semaine?: string }>;
}) {
    const { contrat } = await params;
    const { semaine: lundi } = await searchParams;

    if (!CONTRATS.includes(contrat as TurboyType)) notFound();

    const iso = lundi ? semaineIsoDepuisLundi(lundi) : undefined;
    const reponse = await getPerformanceParContrat(contrat, iso?.annee, iso?.semaine);

    const lignes = reponse?.content ?? [];
    const display = getTurboyTypeDisplay(contrat);
    const requete = lundi ? `?semaine=${lundi}` : '';

    return (
        <div className="space-y-4">
            <div>
                <Link
                    className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
                    href={`/delivery-men/performance-flotte${requete}`}
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Performance de la flotte
                </Link>

                <h1 className="text-2xl font-bold text-foreground">{display.labelPlural}</h1>
                <p className="mt-1 text-sm text-muted">
                    {lignes.length} livreur{lignes.length > 1 ? 's' : ''} dans cette catégorie,
                    programmé{lignes.length > 1 ? 's' : ''} ou non.
                </p>
            </div>

            <SelecteurSemaine semaine={lundi} />

            <AvertissementListeTronquee rendus={lignes.length} total={reponse?.totalElements} />

            {lignes.length === 0 ? (
                <EmptyDataTable title="Aucun livreur dans cette catégorie" />
            ) : (
                <UserListPerformanceBird data={lignes} />
            )}
        </div>
    );
}
