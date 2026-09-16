'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { rentabiliteAPI } from '../apis/rentabilite.api';

export const rentabiliteKeys = {
  all: ['rentabilite'] as const,
  byDate: (dateArret: string) => [...rentabiliteKeys.all, dateArret] as const,
};

/**
 * La rentabilité à une date d'arrêté.
 *
 * <p>`keepPreviousData` : la date fait partie de la clé, donc changer de date vidait
 * l'écran et le remontait. Or changer de date est le SEUL geste de cet écran. Les chiffres
 * précédents restent donc affichés pendant la relecture, comme partout ailleurs dans l'ERP.</p>
 *
 * <p>La requête ne part pas sans date. Sans paramètre le service retombe sur aujourd'hui,
 * et la colonne de comparaison afficherait alors le mois EN COURS sous l'intitulé du mois
 * précédent : une erreur silencieuse et crédible.</p>
 */
export const useRentabiliteQuery = (dateArret: string) =>
  useQuery({
    queryKey: rentabiliteKeys.byDate(dateArret),
    queryFn: () => rentabiliteAPI.getRentabilite(dateArret),
    enabled: Boolean(dateArret),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
