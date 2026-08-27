import { format, subDays } from 'date-fns';
import { ChargeType, Role, ROLE_TO_BACKEND } from '../components/validation.constants';
import { useValidationStatsQuery } from '../queries/validation-stats.query';

interface IChargeTypeStats {
  comptable: { total: number; aDecaisser: number; decaisse: number };
  dga: { enAttente: number; montant: number };
  dg: { enAttente: number; approuvees: number; montant: number };
}

export function getPendingCount(stats: IChargeTypeStats, role: Role): number {
  if (role === 'comptable') return stats.comptable.aDecaisser;
  if (role === 'dga') return stats.dga.enAttente;
  return stats.dg.enAttente;
}

const EMPTY_STATS: IChargeTypeStats = {
  comptable: { total: 0, aDecaisser: 0, decaisse: 0 },
  dga: { enAttente: 0, montant: 0 },
  dg: { enAttente: 0, approuvees: 0, montant: 0 },
};

export function useValidationStats(role: Role, chargeType: ChargeType, debut?: string, fin?: string) {
  const now = new Date();
  const defaultFin = format(now, 'yyyy-MM-dd');
  const defaultDebut = format(subDays(now, 30), 'yyyy-MM-dd');

  const { data, isLoading, isFetching, isError, refetch } = useValidationStatsQuery({
    role: ROLE_TO_BACKEND[role],
    debut: debut ?? defaultDebut,
    fin: fin ?? defaultFin,
  });

  const stats: IChargeTypeStats = data
    ? chargeType === 'fixe' ? data.fixes : data.variables
    : EMPTY_STATS;

  // Sans data on retombe sur EMPTY_STATS, qui affiche « 0 en attente » : indiscernable
  // d'une file de validation vraiment vide. On remonte l'echec a l'ecran.
  return { stats, isLoading, isFetching, isError, refetch };
}
