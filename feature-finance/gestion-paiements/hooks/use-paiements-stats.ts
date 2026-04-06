import { usePaiementsStatsQuery } from '../queries/paiements.query';
import { IPaiementStats } from '../types/paiement.type';

const DEFAULT_STATS: IPaiementStats = {
  totalAPayer: 0,
  enAttente: 0,
  enCours: 0,
  termines: 0,
};

export function usePaiementsStats(mois?: string) {
  const { data, isLoading } = usePaiementsStatsQuery(mois);

  return {
    stats: data ?? DEFAULT_STATS,
    isLoading,
  };
}
