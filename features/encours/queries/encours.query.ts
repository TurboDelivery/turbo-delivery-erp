'use client';

import { useQuery } from '@tanstack/react-query';
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
