'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { useRouter } from 'next/navigation';

import { StatistiquesParJour } from '@/components/creneaux/stats/statistiques-par-jour';
import { creneauFiltersClient } from '@/features/creneaux/filters/creneau.filter';
import { getSundayFromMonday, getWeekDates } from '@/features/creneaux/utils/semaine.utils';
import {
    useCreneauDashboardQuery,
    useCreneauDashboardRealiteQuery,
} from '@/features/creneaux/queries/creneau.query';
import PaginationBlock from '@/components/pagination-block';
import { AbsenceActionDialog, AbsenceActionTarget } from '@/components/creneaux/table/absence-action-dialog';
import { SemaineCreneaux, type LigneTurboy } from '@/features/creneaux/refonte/semaine-creneaux';
import { ICreneauTurboy, ICreneauJour } from '@/features/creneaux/types/creneau.types';

/**
 * L'onglet « Planning hebdomadaire », refondu.
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/creneaux/refonte/semaine-creneaux.tsx`, qui porte le rendu. Ce fichier ne fait
 * plus que brancher les données, l'URL et la modale d'action.</p>
 *
 * <h3>Ce que la page servait, et ce qu'elle sert</h3>
 * <p>Elle affichait dix lignes à la fois, ce qui empêche de voir la forme d'une semaine
 * pour une flotte de deux cent vingt turboys. La page passe à cinquante, et la pagination
 * reste là quand il y a davantage : on ne retire pas une capacité, on cesse de couper la
 * donnée au tiers de sa forme.</p>
 */
const PAGE_SIZE = 50;

export function CreneauPlanningTab() {
    const router = useRouter();
    const [mode, setMode] = useState<'previsionnel' | 'realite'>('previsionnel');
    const [absenceTarget, setAbsenceTarget] = useState<AbsenceActionTarget | null>(null);
    const [filters, setFilters] = useQueryStates(
        creneauFiltersClient.filter,
        creneauFiltersClient.option,
    );

    const queryParams = {
        page: filters.page,
        size: PAGE_SIZE,
        debut: filters.semaine ?? undefined,
        search: filters.search || undefined,
    };

    const estRealite = mode === 'realite';
    const previsionnel = useCreneauDashboardQuery(!estRealite ? queryParams : undefined);
    const realite = useCreneauDashboardRealiteQuery(estRealite ? queryParams : undefined);

    // On suit la query REELLEMENT affichee : la bascule change la source, donc aussi
    // l'echec a signaler et la relance a proposer.
    const { data, isError, isLoading, isFetching, refetch } = estRealite ? realite : previsionnel;

    const selectedSemaine = filters.semaine;
    const fin = useMemo(() => getSundayFromMonday(selectedSemaine), [selectedSemaine]);
    const weekDates = useMemo(() => getWeekDates(selectedSemaine), [selectedSemaine]);

    const turboys = data?.turboys?.data ?? [];
    const statsJour = data?.statsJour ?? [];
    const pageCount = data?.turboys?.pageCount ?? 0;

    /** Le libellé de la semaine, écrit une fois pour l'en-tête du bandeau. */
    const libelleSemaine = useMemo(() => {
        const d = new Date(selectedSemaine);
        const f = new Date(fin);
        if (Number.isNaN(d.getTime()) || Number.isNaN(f.getTime())) return 'Semaine';
        const mois = f.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        return `Semaine du ${d.getDate()} au ${f.getDate()} ${mois}`;
    }, [selectedSemaine, fin]);

    /** Décale d'une semaine, en jours : `setDate` gère les changements de mois. */
    const decalerSemaine = useCallback(
        (semaines: number) => {
            const d = new Date(selectedSemaine);
            if (Number.isNaN(d.getTime())) return;
            d.setDate(d.getDate() + semaines * 7);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            setFilters({ semaine: iso, page: 0 });
        },
        [selectedSemaine, setFilters],
    );

    const handleAbsence = useCallback((turboy: LigneTurboy, jour: { jour: string; date: string }) => {
        if (!turboy.emploiId) return;
        setAbsenceTarget({
            emploiId: turboy.emploiId,
            turoyNomComplet: turboy.nomComplet,
            date: jour.date,
            jourLabel: jour.jour.charAt(0) + jour.jour.slice(1).toLowerCase(),
        });
    }, []);

    /*
     * Le serveur rend les jours dans l'ordre de la semaine ; on leur associe la date
     * calendaire correspondante pour que l'en-tete de colonne mene au bon jour.
     */
    const lignes: LigneTurboy[] = useMemo(
        () =>
            turboys.map((t: ICreneauTurboy) => ({
                id: t.id,
                nomComplet: t.nomComplet,
                avatar: t.avatar,
                assiduite: t.assiduite,
                emploiId: t.emploiId,
                jours: t.jours.map((j: ICreneauJour, i: number) => ({
                    jour: j.jour,
                    date: j.date || weekDates[i] || '',
                    statut: j.statut as LigneTurboy['jours'][number]['statut'],
                })),
            })),
        [turboys, weekDates],
    );

    const parJour = useMemo(
        () =>
            statsJour.map((s) => ({
                jour: s.jour,
                date: s.date,
                presents: s.presents,
                total: s.total,
            })),
        [statsJour],
    );

    return (
        <div className="space-y-6">
            <SemaineCreneaux
                alertes={data?.alertes ?? []}
                isError={isError}
                isLoading={isLoading}
                libelleSemaine={libelleSemaine}
                mode={mode}
                onMode={setMode}
                onOuvrirJour={(date) => router.push(`/delivery-men/creneaux/jour/${date}`)}
                onRecherche={(v) => setFilters({ search: v, page: 0 })}
                onReessayer={() => void refetch()}
                onSemainePrecedente={() => decalerSemaine(-1)}
                onSemaineSuivante={() => decalerSemaine(1)}
                onTraiterAbsence={handleAbsence}
                parJour={parJour}
                recherche={filters.search ?? ''}
                taux={data?.stats ?? null}
                turboys={lignes}
            />

            {/*
             * La pagination reste, mais elle ne coupe plus la semaine au tiers de sa forme :
             * la page est passee de dix a cinquante lignes, et ce bloc n'apparait que
             * lorsqu'il reste vraiment des pages a parcourir.
             */}
            {pageCount > 1 && (
                <div className="flex justify-end">
                    <PaginationBlock
                        currentPage={data?.turboys?.page ?? filters.page}
                        onPageChange={(page) => setFilters({ page })}
                        pageSize={PAGE_SIZE}
                        totalItems={data?.turboys?.total}
                        totalPages={pageCount}
                    />
                </div>
            )}

            {/*
             * La lecture PAR JOUR, sous la matrice et non plus dans une colonne de 320 px a
             * cote d'elle : elle montrait les sept memes jours que les sept colonnes, dans
             * un ordre et une echelle differents, et les montrait deux fois. Le compte des
             * presents remonte desormais dans l'en-tete de chaque colonne ; ce bloc garde
             * la comparaison d'un jour a l'autre, qui est une autre lecture.
             */}
            <StatistiquesParJour data={statsJour} />

            <AbsenceActionDialog onClose={() => setAbsenceTarget(null)} target={absenceTarget} />

            {/* L'attente d'un rafraichissement, sans masquer la semaine deja lisible. */}
            {isFetching && !isLoading && (
                <p className="text-center text-xs text-muted">Mise à jour…</p>
            )}
        </div>
    );
}
