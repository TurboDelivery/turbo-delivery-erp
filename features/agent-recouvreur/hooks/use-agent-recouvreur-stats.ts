'use client';

import { useMemo } from 'react';
import { Clock, TrendingUp, FileText, DollarSign } from 'lucide-react';
import type { ElementType } from 'react';
import { useAgentFacturesStatsQuery } from '../queries';
import type { IAgentFactureParams } from '../types';

export interface AgentRecouvreurStatCard {
  key: 'enAttente' | 'avecAcompte' | 'soldees' | 'tauxRecouvrement';
  label: string;
  value: string;
  icon: ElementType;
  color: string;
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
      { key: 'enAttente', label: 'En attente de paiement', value: String(enAttente), icon: Clock, color: 'bg-orange-400' },
      { key: 'avecAcompte', label: 'Paiement avec acompte', value: String(avecAcompte), icon: TrendingUp, color: 'bg-teal-500' },
      { key: 'soldees', label: 'Factures soldées', value: String(soldees), icon: FileText, color: 'bg-green-500' },
      { key: 'tauxRecouvrement', label: 'Taux de recouvrement', value: `${tauxRecouvrement}%`, icon: DollarSign, color: 'bg-blue-500' },
    ];
  }, [data]);

  return { statsCards, isLoading, isError, raw: data };
}

export default useAgentRecouvreurStats;
