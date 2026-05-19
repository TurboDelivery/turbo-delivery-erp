'use client';

import { useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { agentRecouvreurFilters } from '@/features/agent-recouvreur';
import type { CycleFiltre, IAgentFactureParams } from '../types';

export function useAgentRecouvreurFilters() {
  const [filters, setFilters] = useQueryStates(agentRecouvreurFilters.filter, agentRecouvreurFilters.option);

  const params: IAgentFactureParams = useMemo(
    () => ({
      cycle: filters.cycle && filters.cycle !== 'TOUT' ? (filters.cycle as CycleFiltre) : undefined,
      dateDebut: filters.dateDebut ? filters.dateDebut.toISOString().split('T')[0] : undefined,
      dateFin: filters.dateFin ? filters.dateFin.toISOString().split('T')[0] : undefined,
      statut: filters.statut || undefined,
      page: filters.page,
      size: filters.size,
    }),
    [filters],
  );

  const statsParams: IAgentFactureParams = useMemo(() => {
    const { page, size, ...rest } = params;
    return rest;
  }, [params]);

  return { filters, setFilters, params, statsParams };
}

export default useAgentRecouvreurFilters;
