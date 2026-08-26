'use client';

import { useMemo } from 'react';
import { Clock, TrendingUp, FileText, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAgentFacturesStatsQuery } from '../queries';
import type { IAgentFactureParams } from '../types';
import type { TonStat } from '@/components/commons/CarteStat';

export interface AgentRecouvreurStatCard {
  key: 'enAttente' | 'avecAcompte' | 'soldees' | 'tauxRecouvrement';
  label: string;
  value: string;
  /**
   * Les quatre icones viennent de `lucide-react` (Clock, TrendingUp, FileText,
   * DollarSign) : le type le DIT desormais, au lieu d'un `ElementType` trop large
   * que la carte partagee ne peut pas accepter.
   */
  icon: LucideIcon;
  /** JETON de couleur, plus une classe Tailwind brute : le mode sombre reviendra. */
  ton: TonStat;
}

export function useAgentRecouvreurStats(params: IAgentFactureParams, agentIdOverride?: string) {
  // Endpoint dédié /factures/stats — renvoie {enAttente, avecAcompte, soldees,
  // tauxRecouvrement} à plat. Avant on lisait data?.stats?.enAttente sur la
  // query LISTE (useAgentFacturesQuery), ce qui était toujours undefined
  // depuis que le backend a séparé la list et les stats en 2 endpoints.
  const { data, isLoading, isError } = useAgentFacturesStatsQuery(params, agentIdOverride);

  const statsCards = useMemo<AgentRecouvreurStatCard[]>(() => {
    const enAttente = data?.enAttente ?? 0;
    const avecAcompte = data?.avecAcompte ?? 0;
    const soldees = data?.soldees ?? 0;
    const tauxRecouvrement = data?.tauxRecouvrement ?? 0;
    return [
      // `ton` remplace `color` : la couleur ne s'ecrit plus en classe Tailwind brute
      // mais en JETON, pour que le retour du mode sombre ne demande aucune retouche.
      { key: 'enAttente', label: 'En attente de paiement', value: String(enAttente), icon: Clock, ton: 'attention' as TonStat },
      { key: 'avecAcompte', label: 'Paiement avec acompte', value: String(avecAcompte), icon: TrendingUp, ton: 'succes' as TonStat },
      { key: 'soldees', label: 'Factures soldées', value: String(soldees), icon: FileText, ton: 'succes' as TonStat },
      { key: 'tauxRecouvrement', label: 'Taux de recouvrement', value: `${tauxRecouvrement}%`, icon: DollarSign, ton: 'primaire' as TonStat },
    ];
  }, [data]);

  return { statsCards, isLoading, isError, raw: data };
}

export default useAgentRecouvreurStats;
