import { useCategorieDepensesListQuery } from '@/features/depenses/queries/category/categorie-depense.query';

export const useCategorieDepense = () => {
  const { data, isLoading, error, isError, isFetching, refetch } = useCategorieDepensesListQuery({});

  return {
    categories: data || [],
    isLoading,
    isError,
    error,
    // `isError` etait remonte sans relance : un ecran ne pouvait qu'afficher une
    // liste de categories vide, indiscernable d'un referentiel reellement vide.
    isFetching,
    refetch,
  };
}
