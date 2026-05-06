import { useDepensesVariablesQuery } from '@/features/rapports-financiers/queries/depenses-variables.query';
import { IDepenseVariableParams } from '@/features/rapports-financiers/types/depenses-variables.type';

export const useDepensesVariables = (params: IDepenseVariableParams) => {
  const { data, isLoading, error, isError, refetch } = useDepensesVariablesQuery(params);

  return {
    items: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.number ?? 0,
    isFirst: data?.first ?? true,
    isLast: data?.last ?? true,
    isLoading,
    error,
    isError,
    refetch,
  };
};
