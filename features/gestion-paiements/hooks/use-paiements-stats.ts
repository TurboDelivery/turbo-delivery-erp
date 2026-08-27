import { useMemo } from 'react';
import { useDecaissementStatsQuery } from '../queries/decaissement-stats.query';
import { IPaiementStats } from '../types/paiement.type';

const DEFAULT_STATS: IPaiementStats = {
  totalGlobal: 0,
  aDecaisser: 0,
  decaisse: 0,
};

export function usePaiementsStats(debut?: string, fin?: string) {
  const { data, isLoading, isFetching, isError, refetch } = useDecaissementStatsQuery({ debut, fin });

  const stats = useMemo<IPaiementStats>(() => {
    if (!data) return DEFAULT_STATS;
    return {
      totalGlobal: data.totalADecaisser + data.totalDecaisse,
      aDecaisser: data.totalADecaisser,
      decaisse: data.totalDecaisse,
    };
  }, [data]);

  // Sur echec la query ne rend rien et le bandeau retombe sur DEFAULT_STATS, donc
  // « 0 FCFA a decaisser » : on remonte l'echec pour que l'ecran le dise.
  return { stats, isLoading, isFetching, isError, refetch };
}
