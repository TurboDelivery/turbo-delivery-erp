'use client';

import React, { useState } from 'react';
import { DollarSign, WalletCards } from 'lucide-react';
import { useCAExport } from '@/feature-finance/dashboard/hooks/use-ca-export';
import { useGlobalStats } from '@/feature-finance/dashboard/queries/global-stats.query';
import { useRouter } from 'next/navigation';
import DateFilterInput from '@/components/finance/date-filter-input';
import { DateRange } from 'react-day-picker';
import { startOfMonth } from 'date-fns';
import CACard from './ca-card';
import StatCard from './stat-card';
import { ArrowDown } from 'lucide-react';

export default function Statistics() {
  const router = useRouter();

  // État pour le filtre par plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Utiliser React Query pour les données globales
  const { data: globalStats, isLoading } = useGlobalStats({
    debut: dateRange?.from,
    fin: dateRange?.to,
  });

  // Utiliser les données de l'API globale pour les statistiques
  const chiffreAffaires = globalStats?.chiffreAffaire || 0;
  const revenusEncaisses = globalStats?.revenuEncaisse || 0;
  const sommeDepenses = globalStats?.depenses || 0;
  const soldeCompte = globalStats?.solde || 0;
  const fraisLivraison = globalStats?.fraisLivraison || 0;
  const commissions = globalStats?.commission || 0;
//   const investissement = globalStats?.investissement || 0;
  const isSoldePositif = soldeCompte > 0;

  // Titre dynamique pour la carte CA
  const caTitle = dateRange ? 'CA de la Période' : 'CA du Mois';

  // Hook pour l'exportation Excel du CA
  const { exportCAToExcel, isLoadingCAExport } = useCAExport();

  // Fonction pour télécharger les détails du CA en Excel
  const handleDownloadDetails = () => {
    // Utiliser la plage de dates sélectionnée
    const debut = dateRange?.from;
    const fin = dateRange?.to;

    // Appeler l'exportation Excel
    exportCAToExcel({
      debut,
      fin,
      selectedMonth: null,
      selectedYear: debut?.getFullYear() || new Date().getFullYear(),
    });
  };

  return (
    <div className="w-full px-4 py-6">
      {/* En-tête avec filtre */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord financier</h2>
        <DateFilterInput
          filters={{
            debut: dateRange?.from,
            fin: dateRange?.to,
          }}
          handleDateChange={setDateRange}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Carte CA du Mois sur toute la largeur */}
        <CACard
          title={caTitle}
          totalAmount={chiffreAffaires}
          fraisLivraison={fraisLivraison}
          commissions={commissions}
          // investissement={investissement}
          isLoading={isLoading}
          isLoadingExport={isLoadingCAExport}
          onDownload={handleDownloadDetails}
        />

        {/* Les 3 autres cartes sur la ligne du dessous */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Revenus Encaissés"
            value={revenusEncaisses}
            icon={WalletCards}
            color="text-blue-600"
            bgColor="bg-blue-100"
            trend="up"
            isLoading={isLoading}
            clickable
            onClick={() => router.push('/finance/revenus-encaisses')}
          />

          <StatCard
            title="Total Dépenses"
            value={sommeDepenses}
            icon={ArrowDown}
            color="text-red-600"
            bgColor="bg-red-100"
            trend="down"
            isLoading={isLoading}
            clickable
            onClick={() => router.push('/finance/depense')}
          />

          <StatCard
            title="Solde de Compte"
            value={Math.abs(soldeCompte)}
            icon={DollarSign}
            color={isSoldePositif ? 'text-green-600' : 'text-red-600'}
            bgColor={isSoldePositif ? 'bg-green-100' : 'bg-red-100'}
            trend={isSoldePositif ? 'up' : 'down'}
            isLoading={isLoading}
            additionalInfo={isSoldePositif ? 'Excédent' : 'Déficit'}
          />
        </div>
      </div>
    </div>
  );
}
