'use client';

import { useQueryStates } from 'nuqs';
import { ILivreurSearchParams } from '@/features/tickets/types/tickets.type';
import { factureFiltersClient } from '@/features/tickets/filters/facture.filters';
import { obtenirDatesDepuisSemaine } from '@/features/tickets/utils/date.utils';

export function useFactureFilters() {
  const [factureFilters, setFactureFilter] = useQueryStates(factureFiltersClient.filters, factureFiltersClient.option);

  const setFactureFilterValue = <K extends keyof ILivreurSearchParams>(key: K, value: string | Date | number) => {
    void setFactureFilter({ [key]: value });
  };

  const setFactureSearch = (value: string | undefined) => {
    if (value) {
      setFactureFilterValue('idLivreur', value); // tout passe par le search du backend
    } else {
      setFactureFilterValue('idLivreur', '');
    }
  };

  const setFactureWeekFilter = (semaine: string) => {
    const { debutDate, finDate } = obtenirDatesDepuisSemaine(semaine);
    setFactureFilterValue('creneauDebut', debutDate);
    setFactureFilterValue('creneauFin', finDate);
  };

  return {
    factureFilters,
    setFactureFilterValue,
    setFactureWeekFilter,
    setFactureSearch,
  };
}
