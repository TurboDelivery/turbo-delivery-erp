'use client';
import { useMemo } from 'react';

import RecouvrementStatsBar from '../../../../components/finance/recouvrements/stats/recouvrement-stats-bar';
import { useRecouvrementList } from '@/feature-finance/revenus/hooks/use-recouvrement';
import { usePretList } from '@/feature-finance/revenus/hooks/use-pret-list';

export default function Recouvrement() {
  const { recouvrement: recouvrementsData } = useRecouvrementList();
  const { facture: facturesData } = usePretList();

  // Gérer les données paginées pour les recouvrements
  const recouvrements = useMemo(() => {
    if (!recouvrementsData) return [];
    if (Array.isArray(recouvrementsData)) return recouvrementsData;
    return recouvrementsData || [];
  }, [recouvrementsData]);

  // Gérer les données paginées pour les factures
  const factures = useMemo(() => {
    if (!facturesData) return [];
    if (Array.isArray(facturesData)) return facturesData;
    return facturesData || [];
  }, [facturesData]);

  return <RecouvrementStatsBar recouvrements={recouvrements} factures={factures} />;
}
