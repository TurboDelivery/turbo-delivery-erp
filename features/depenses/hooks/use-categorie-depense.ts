import { useCategorieDepensesListQuery } from '@/feature-finance/depenses/queries/category/categorie-depense.query';

export const useCategorieDepense = () => {
  const { data, isLoading, error, isError } = useCategorieDepensesListQuery({});

  return {
    categories: data || [],
    isLoading,
    isError,
    error,
  };
}