import { useMemo } from 'react';
import { useChargesVariablesQuery } from '@/feature-finance/charges/queries/charges-variables.query';
import { useChargesFixesQuery } from '@/feature-finance/charges/queries/charges-fixes.query';
import { useHistoriqueChargesQuery } from '@/feature-finance/charges/queries/historique-charge.query';
import { IDepense } from '@/features/depenses/types/depense.type';
import {
  ChargeType,
  Role,
  ROLE_TO_BACKEND,
  chargeFixeToDepense,
  chargeVariableToDepense,
  historiqueChargeToDepense,
} from '../components/validation.constants';

export function useValidationData(chargeType: ChargeType, role: Role) {
  const backendRole = ROLE_TO_BACKEND[role];
  const variablesQuery = useChargesVariablesQuery({ page: 0, size: 100, role: backendRole }, chargeType === 'variable');
  const fixesQuery = useChargesFixesQuery({ page: 0, size: 100, role: backendRole }, chargeType === 'fixe');

  const depenses = useMemo<IDepense[]>(() => {
    if (chargeType === 'variable') {
      return (variablesQuery.data?.content ?? []).map(chargeVariableToDepense);
    }
    return (fixesQuery.data?.content ?? []).map(chargeFixeToDepense);
  }, [chargeType, variablesQuery.data, fixesQuery.data]);

  const rawVariables = chargeType === 'variable' ? variablesQuery.data?.content : undefined;

  const isLoading = chargeType === 'variable' ? variablesQuery.isLoading : fixesQuery.isLoading;

  return { depenses, rawVariables, isLoading };
}

export function useHistoryData(role: Role, enabled: boolean) {
  const backendRole = ROLE_TO_BACKEND[role] as 'DGA' | 'DG' | 'COMPTABLE';
  const historiqueQuery = useHistoriqueChargesQuery(
    { page: 0, size: 100, role: backendRole },
    enabled,
  );

  const depenses = useMemo<IDepense[]>(() => {
    return (historiqueQuery.data ?? []).map(historiqueChargeToDepense);
  }, [historiqueQuery.data]);

  return { depenses, isLoading: historiqueQuery.isLoading };
}
