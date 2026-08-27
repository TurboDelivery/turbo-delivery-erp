import { useMemo } from 'react';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { useHistoriqueChargesQuery } from '@/features/charges/queries/historique-charge.query';
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
    { page: 0, size: 20, role: backendRole },
    enabled,
  );

  const depenses = useMemo<IDepense[]>(() => {
    return (historiqueQuery.data?.content ?? []).map(historiqueChargeToDepense);
  }, [historiqueQuery.data?.content]);

  return { depenses, isLoading: historiqueQuery.isLoading };
}

