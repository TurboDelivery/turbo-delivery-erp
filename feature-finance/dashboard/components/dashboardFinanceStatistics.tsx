'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ArrowDown, DollarSign } from 'lucide-react';
import { useCAExport } from '@/feature-finance/dashboard/hooks/use-ca-export';
import { useGlobalStats } from '@/feature-finance/dashboard/queries/global-stats.query';
import DateFilterInput from '@/components/finance/date-filter-input';
import { DateRange } from 'react-day-picker';
import { startOfMonth } from 'date-fns';
import CACard from './ca-card';
import FinanceHighlightCard from './finance-highlight-card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useDepenseSummaryQuery } from '@/feature-finance/depenses/queries/depense-summary.query';

export default function DashboardFinanceStatistics() {
  // État pour le filtre par plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: now,
    };
  });

  const debut = dateRange?.from;
  const fin = dateRange?.to;
  const queryParams = useMemo(() => ({ debut, fin }), [debut, fin]);

  // Utiliser React Query pour les données globales
  const { data: globalStats, isLoading } = useGlobalStats(queryParams);

  const { data: depenseSummary } = useDepenseSummaryQuery(queryParams);

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

  return (
    <div className="w-full px-4 py-6">
      {/* En-tête avec filtre */}
      <div className="flex justify-between items-center mb-6 bg-white">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord financier</h2>
        <DateFilterInput filters={dateFilters} handleDateChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Carte CA du Mois sur toute la largeur */}
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
        />

        <div className="flex max-md:flex-col items-center justify-between gap-4">
          <FinanceHighlightCard title="Total dépenses" value={formattedDepenses} icon={ArrowDown} tone="red" href="/finance/depense" ariaLabel="Voir la liste des dépenses">
            <div className="flex flex-col gap-0.5">
              <div className="bg-red-500 text-white rounded-lg px-2 py-1.5 flex gap-4 justify-between text-sm">
                <span>Charges fixes</span>
                <span>{formattedRecurrentes}</span>
              </div>
              <div className="bg-orange-500 text-white rounded-lg px-2 py-1.5 flex gap-4 justify-between text-sm">
                <span>Charges variables</span>
                <span>{formattedNonRecurrentes}</span>
              </div>
            </div>
          </FinanceHighlightCard>
          <FinanceHighlightCard title="La marge" value={formattedMarge} icon={DollarSign} tone="orange" />
        </div>
        <div className={`rounded-xl px-4 py-3 border ${margeStateClassName}`}>
          <p className="text-sm font-medium text-center">{margeStateLabel}</p>
        </div>
      </div>
    </div>
  );
}
