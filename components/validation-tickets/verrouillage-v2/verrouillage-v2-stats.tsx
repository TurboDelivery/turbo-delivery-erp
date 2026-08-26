'use client';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { CreneauTicketStatsVm } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface VerrouillageV2StatsProps {
  stats: CreneauTicketStatsVm | undefined;
  isLoading?: boolean;
}

/**
 * Bandeau de tete du verrouillage V2.
 *
 * <p>Il portait sa propre carte en classes de palette brutes (gray) et un second bandeau
 * de squelettes ecrit a la main, qui devait rester aligne sur le premier. Les deux passent
 * par `CarteStat`, dont `isLoading` rend le squelette : une seule grille a maintenir, et
 * aucune couleur en dur a reprendre au retour du mode sombre.</p>
 */
export function VerrouillageV2Stats({ stats, isLoading }: VerrouillageV2StatsProps) {
  return (
    <GrilleStats colonnes={4}>
      <CarteStat libelle="Tickets V2 validés" valeur={stats?.nbV2Valide ?? '—'} isLoading={isLoading} />
      <CarteStat
        libelle="Total commandes"
        valeur={stats != null ? formatCFA(stats.totalMontantCommandesV2Valide) : '—'}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Total commissions"
        valeur={stats != null ? formatCFA(stats.totalCommissionsV2Valide) : '—'}
        isLoading={isLoading}
      />
      <CarteStat libelle="Total tickets créneau" valeur={stats?.nbTotalTickets ?? '—'} isLoading={isLoading} />
    </GrilleStats>
  );
}
