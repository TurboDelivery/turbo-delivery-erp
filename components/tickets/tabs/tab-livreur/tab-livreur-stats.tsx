import React from 'react';
import { Button } from '@heroui/react';
import useRecapPaieLivreurs from '@/features/tickets/hooks/use-recap-paie-livreurs';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

function TabLivreurStats() {
  const { exportLivreurRecapPaieToExcel, isLoadingLivreurRecapPaie, totalToPay, isLoadingLivreurRecapPaieStats } = useRecapPaieLivreurs();
  return (
    <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
      <div>
        <p>Total à régler :</p>
        {!isLoadingLivreurRecapPaieStats && <p className="text-2xl font-bold">{formatCFA(totalToPay)}</p>}
        {isLoadingLivreurRecapPaieStats && <div className="h-8 w-32 bg-gray-300 rounded animate-pulse mt-2"></div>}
      </div>
      <Button onPress={() => exportLivreurRecapPaieToExcel()} isLoading={isLoadingLivreurRecapPaie} color="success" variant="shadow">
        Télécharger le détails
      </Button>
    </div>
  );
}

export default TabLivreurStats;
