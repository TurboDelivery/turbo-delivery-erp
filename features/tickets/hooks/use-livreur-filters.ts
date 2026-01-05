'use client';

import { useQueryStates } from 'nuqs';
import { ILivreurSearchParams } from '@/features/tickets/types/tickets.type';
import { livreursFiltersClient } from '@/features/tickets/filters/livreurs.filters';
import { obtenirDatesDepuisSemaine } from '@/features/tickets/utils/date.utils';

export function useLivreurFilters() {
  const [filters, setFilters] = useQueryStates(livreursFiltersClient.filters, livreursFiltersClient.option);

  const setFilter = <K extends keyof ILivreurSearchParams>(key: K, value: string | Date | number) => {
    void setFilters({ [key]: value });
  };

  const setLivreurSearch = (value: string) => {
    setFilter('livreur', value); // tout passe par le search du backend
  };

  const setLivreurWeekFilter = (semaine: string) => {
    const { debutDate, finDate } = obtenirDatesDepuisSemaine(semaine);
    setFilter('creneauDebut', debutDate);
    setFilter('creneauFin', finDate);
  };

  return {
    filters,
    setFilter,
    setLivreurWeekFilter,
    setLivreurSearch,
  };
}
