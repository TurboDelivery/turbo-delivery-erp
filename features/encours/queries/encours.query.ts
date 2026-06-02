'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { encoursAPI } from '../apis/encours.api';
import { IEncoursParams } from '../types/encours.types';

export const encoursKeys = {
  all: ['encours'] as const,
  releve: (params: IEncoursParams) => [...encoursKeys.all, 'releve', params] as const,
  groupes: () => [...encoursKeys.all, 'groupes'] as const,
  deductions: (annee: number) => [...encoursKeys.all, 'deductions', annee] as const,
};

/** Relevé des restes à payer (cascade Partenaire → Store + déductions). */
export const useEncoursQuery = (params: IEncoursParams) =>
  useQuery({
    queryKey: encoursKeys.releve(params),
    queryFn: () => encoursAPI.getReleve(params),
    enabled: !!params.annee,
    staleTime: 5 * 60 * 1000,
  });

/** Liste des groupes partenaires (pour le filtre). */
export const useEncoursGroupesQuery = () =>
  useQuery({
    queryKey: encoursKeys.groupes(),
    queryFn: () => encoursAPI.getGroupes(),
    staleTime: 30 * 60 * 1000,
  });

/** Liste brute des déductions (avec id) d'une année — pour la gestion (CRUD). */
export const useDeductionsQuery = (annee: number) =>
  useQuery({
    queryKey: encoursKeys.deductions(annee),
    queryFn: () => encoursAPI.listerDeductions(annee),
    enabled: !!annee,
    staleTime: 5 * 60 * 1000,
  });

/** Invalide tout l'ENCOURS (relevé + déductions) après une mutation. */
export const useInvalidateEncours = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: encoursKeys.all });
};
