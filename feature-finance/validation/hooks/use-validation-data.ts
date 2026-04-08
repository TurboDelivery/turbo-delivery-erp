import { useMemo } from 'react';
import { useChargesVariablesQuery } from '@/feature-finance/charges/queries/charges-variables.query';
import { useChargesFixesQuery } from '@/feature-finance/charges/queries/charges-fixes.query';
import { IDepense } from '@/features/depenses/types/depense.type';
import { ChargeType, Role, ROLE_TO_BACKEND, chargeFixeToDepense, chargeVariableToDepense } from '../components/validation.constants';

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

  const isLoading = chargeType === 'variable' ? variablesQuery.isLoading : fixesQuery.isLoading;

  return { depenses, isLoading };
}

export function useHistoryData(chargeType: ChargeType, enabled: boolean) {
  const variablesQuery = useChargesVariablesQuery({ page: 0, size: 100 }, chargeType === 'variable' && enabled);
  const fixesQuery = useChargesFixesQuery({ page: 0, size: 100 }, chargeType === 'fixe' && enabled);

  const depenses = useMemo<IDepense[]>(() => {
    if (chargeType === 'variable') {
      return (variablesQuery.data?.content ?? []).map(chargeVariableToDepense);
    }
    return (fixesQuery.data?.content ?? []).map(chargeFixeToDepense);
  }, [chargeType, variablesQuery.data, fixesQuery.data]);

  const isLoading = chargeType === 'variable' ? variablesQuery.isLoading : fixesQuery.isLoading;

  return { depenses, isLoading };
}
