'use client';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { CreneauTicketStatsVm } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { formatNombre } from '@/utils/format.utils';

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
 *
 * <p>Les deux cartes de comptage rendaient leur nombre BRUT (`1250`) pendant que les deux
 * cartes de montant qui les jouxtent passaient par les separateurs de milliers
 * (`1 250 FCFA`). Sur un creneau charge, deux ordres de grandeur voisins ne se comparaient
 * donc pas d'un coup d'oeil. `formatNombre` est le helper de comptage deja utilise par le
 * bandeau de reference de l'ecran Tickets.</p>
 */
export function VerrouillageV2Stats({ stats, isLoading }: VerrouillageV2StatsProps) {
  return (
    <GrilleStats colonnes={4}>
      <CarteStat
        libelle="Tickets V2 validés"
        valeur={stats != null ? formatNombre(stats.nbV2Valide) : '—'}
        isLoading={isLoading}
      />
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
      <CarteStat
        libelle="Total tickets créneau"
        valeur={stats != null ? formatNombre(stats.nbTotalTickets) : '—'}
        isLoading={isLoading}
      />
    </GrilleStats>
  );
}
