'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ArrowDown, Banknote, CalendarRange, Clock, DollarSign, Layers, TrendingUp, Wallet } from 'lucide-react';
import { useCAExport } from '@/features/finance-dashboard/hooks/use-ca-export';
import { useGlobalStats } from '@/features/finance-dashboard/queries/global-stats.query';
import DateFilterInput from '@/components/finance/date-filter-input';
import { DateRange } from 'react-day-picker';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import CACard from './ca-card';
import FinanceHighlightCard from './finance-highlight-card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useDepenseSummaryQuery } from '@/features/depenses/queries/depense-summary.query';
import { useFinanceResumeQuery } from '@/features/finance-dashboard/queries/finance-resume.query';
import EtatErreur from '@/components/commons/EtatErreur';
import { Card } from '@heroui-v3/react';

export default function DashboardFinanceStatistics() {
  // État pour le filtre par plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  });

  const debut = dateRange?.from;
  const fin = dateRange?.to;
  const queryParams = useMemo(() => ({ debut, fin }), [debut, fin]);

  // Utiliser React Query pour les données globales
  const {
    data: globalStats,
    isLoading,
    isFetching: isFetchingGlobal,
    isError: isErrorGlobal,
    refetch: refetchGlobal,
  } = useGlobalStats(queryParams);

  const {
    data: depenseSummary,
    isFetching: isFetchingSummary,
    isError: isErrorSummary,
    refetch: refetchSummary,
  } = useDepenseSummaryQuery(queryParams);
  const {
    data: resume,
    isFetching: isFetchingResume,
    isError: isErrorResume,
    refetch: refetchResume,
  } = useFinanceResumeQuery(queryParams);

  // Utiliser les données de l'API globale pour les statistiques
  const chiffreAffaires = globalStats?.chiffreAffaire ?? 0;
  const fraisLivraison = globalStats?.fraisLivraison ?? 0;
  const commissions = globalStats?.commission ?? 0;
  const totalRecurrentes = depenseSummary?.totalRecurrentes ?? 0;
  const totalNonRecurrentes = depenseSummary?.totalNonRecurrentes ?? 0;
  const sommeDepenses = totalNonRecurrentes + totalRecurrentes;
  const marge = chiffreAffaires - sommeDepenses;
  const isDeficit = marge < 0;
  const margeStateLabel = isDeficit ? 'Déficit' : 'Excédent';
  const margeStateClassName = isDeficit ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
  const formattedDepenses = formatCFA(sommeDepenses);
  const formattedMarge = formatCFA(marge);
  const formattedRecurrentes = formatCFA(totalRecurrentes);
  const formattedNonRecurrentes = formatCFA(totalNonRecurrentes);
  //   const investissement = globalStats?.investissement || 0;

  // Liens de drill-down : on ouvre la page concernée avec la période pré-appliquée.
  const toIso = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');
  const periodeQS = debut && fin ? `?debut=${toIso(debut)}&fin=${toIso(fin)}` : '';
  const facturesPeriodeQS =
    debut && fin ? `?tab=factures&fPeriodeDebut=${toIso(debut)}&fPeriodeFin=${toIso(fin)}` : '';
  // Cumul : plage « tout l'historique » (l'app démarre en 2024 → aujourd'hui).
  const ALL_TIME_DEBUT = '2024-01-01';
  const allTimeFin = format(new Date(), 'yyyy-MM-dd');
  // La page /finance/charges a été supprimée : les dépenses sont désormais pilotées
  // depuis le tableau de bord Finance unifié (/finance/dashboard).
  const depensesCumuleHref = '/finance/dashboard';
  const encoursCumuleHref = `/finance/recouvrement?tab=factures&fPeriodeDebut=${ALL_TIME_DEBUT}&fPeriodeFin=${allTimeFin}`;

  // Titre dynamique pour la carte CA
  const caTitle = dateRange ? 'CA de la Période' : 'CA du Mois';

  // Hook pour l'exportation Excel du CA
  const { exportCAToExcel, isLoadingCAExport } = useCAExport();

  // Fonction pour télécharger les détails du CA en Excel
  const handleDownloadDetails = useCallback(() => {
    if (!debut || !fin || debut > fin) {
      return;
    }

    // Appeler l'exportation Excel
    exportCAToExcel({
      debut,
      fin,
      selectedMonth: null,
      selectedYear: debut?.getFullYear() || new Date().getFullYear(),
    });
  }, [debut, fin, exportCAToExcel]);

  const dateFilters = useMemo(
    () => ({
      debut,
      fin,
    }),
    [debut, fin],
  );

  // Trois requetes alimentent les indicateurs. Sur echec, chacune retombe sur `?? 0`
  // et l'ecran affiche « 0 FCFA » : un chiffre faux se lit comme un chiffre vrai.
  // Les indicateurs de periode croisent les trois (la marge = CA - depenses).
  const isErrorIndicateurs = isErrorGlobal || isErrorSummary || isErrorResume;
  const isFetchingIndicateurs = isFetchingGlobal || isFetchingSummary || isFetchingResume;
  const reessayerIndicateurs = useCallback(() => {
    refetchGlobal();
    refetchSummary();
    refetchResume();
  }, [refetchGlobal, refetchSummary, refetchResume]);

  return (
    <div className="w-full px-4 py-6">
      {/* En-tête avec filtre */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-white">
        <h2 className="text-2xl font-bold text-primary">Tableau de bord financier</h2>
        <DateFilterInput filters={dateFilters} handleDateChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Carte CA du Mois sur toute la largeur */}
        {isErrorGlobal ? (
          <Card className="rounded-xl border border-gray-200 p-0">
            <EtatErreur
              quoi="le chiffre d'affaires"
              onReessayer={() => refetchGlobal()}
              enCours={isFetchingGlobal}
            />
          </Card>
        ) : (
        <CACard
          title={caTitle}
          totalAmount={chiffreAffaires}
          fraisLivraison={fraisLivraison}
          commissions={commissions}
          // investissement={investissement}
          commissionFixe={globalStats?.commissionFixe ?? 0}
          commissionPourcentage={globalStats?.commissionPourcentage ?? 0}
          isLoading={isLoading}
          isLoadingExport={isLoadingCAExport}
          onDownload={handleDownloadDetails}
          detailHref="/finance/revenue"
        />
        )}

        {/* ── Section : indicateurs de la période ── */}
        <div className="flex items-center gap-2 pt-1">
          <CalendarRange className="size-4 text-primary" />
          <h3 className="text-sm 2xl:text-base font-semibold text-gray-700">Indicateurs de la période</h3>
        </div>
        {isErrorIndicateurs ? (
          <Card className="rounded-xl border border-gray-200 p-0">
            <EtatErreur
              quoi="les indicateurs de la période"
              onReessayer={reessayerIndicateurs}
              enCours={isFetchingIndicateurs}
            />
          </Card>
        ) : (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FinanceHighlightCard
            title="Revenus encaissés"
            value={formatCFA(resume?.totalRevenus ?? 0)}
            icon={Banknote}
            tone="blue"
            href={`/finance/recouvrement${periodeQS}`}
            ariaLabel="Voir les recouvrements de la période"
          />
          <FinanceHighlightCard title="Total dépenses" value={formattedDepenses} icon={ArrowDown} tone="red" href="/finance/dashboard" ariaLabel="Voir les dépenses de la période">
            <div className="flex flex-col gap-0.5">
              {/* red-500 et orange-500 donnaient 3,81:1 et 2,89:1 en blanc dessus ; les nuances 700
                     montent a 6,42:1 et 5,22:1 sans changer de teinte. */}
              <div className="bg-red-700 text-white rounded-lg px-2 py-1.5 flex gap-4 justify-between text-medium 2xl:text-lg">
                <span>Charges fixes</span>
                <span>{formattedRecurrentes}</span>
              </div>
              <div className="bg-orange-700 text-white rounded-lg px-2 py-1.5 flex gap-4 justify-between text-medium 2xl:text-lg">
                <span>Charges variables</span>
                <span>{formattedNonRecurrentes}</span>
              </div>
            </div>
          </FinanceHighlightCard>
          <FinanceHighlightCard title="Marge" value={formattedMarge} icon={DollarSign} tone="orange" href="/finance/analyse-rentabilite" ariaLabel="Voir l'analyse de rentabilité" />
          <FinanceHighlightCard
            title="Encours"
            value={formatCFA(resume?.totalFacturesEnCours ?? 0)}
            icon={Clock}
            tone="purple"
            href={`/finance/recouvrement${facturesPeriodeQS}`}
            ariaLabel="Voir les factures en cours de la période"
          />
          <FinanceHighlightCard
            title="Investissements"
            value={formatCFA(resume?.totalInvestissements ?? 0)}
            icon={TrendingUp}
            tone="yellow"
            href={`/finance/revenue/investissement${periodeQS}`}
            ariaLabel="Voir les investissements de la période"
          />
        </div>

        <Card className={`flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3 ${margeStateClassName}`}>
          {isDeficit ? <ArrowDown className="size-4" /> : <TrendingUp className="size-4" />}
          <p className="text-sm 2xl:text-base font-medium">
            {margeStateLabel} (période) : {formattedMarge}
          </p>
        </Card>
          </>
        )}

        {/* ── Section : cumul tout l'historique (bloc visuellement distinct) ── */}
        <Card className="mt-1 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-indigo-500" />
            <h3 className="text-sm 2xl:text-base font-semibold text-gray-700">Cumul · tout l&apos;historique</h3>
          </div>
          {isErrorResume ? (
            <EtatErreur
              quoi="les cumuls financiers"
              onReessayer={() => refetchResume()}
              enCours={isFetchingResume}
            />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FinanceHighlightCard
              title="CA cumulé"
              value={formatCFA(resume?.chiffreAffaireCumule ?? 0)}
              icon={Wallet}
              tone="green"
              href="/finance/revenue"
              ariaLabel="Voir le cumul des revenus"
            />
            <FinanceHighlightCard
              title="Dépenses cumulées"
              value={formatCFA(resume?.totalDepensesCumule ?? 0)}
              icon={ArrowDown}
              tone="red"
              href={depensesCumuleHref}
              ariaLabel="Voir toutes les dépenses (cumul)"
            />
            <FinanceHighlightCard
              title="Marge cumulée"
              value={formatCFA(resume?.margeCumule ?? 0)}
              icon={DollarSign}
              tone="orange"
              href="/finance/analyse-rentabilite"
              ariaLabel="Voir l'analyse de rentabilité"
            />
            <FinanceHighlightCard
              title="Encours cumulé"
              value={formatCFA(resume?.totalFacturesEnCoursCumule ?? 0)}
              icon={Clock}
              tone="indigo"
              href={encoursCumuleHref}
              ariaLabel="Voir toutes les factures en cours (cumul)"
            />
          </div>
          )}
        </Card>
      </div>
    </div>
  );
}
