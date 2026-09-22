'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { encoursAPI } from '../apis/encours.api';
import { IEncoursParams } from '../types/encours.types';

export const encoursKeys = {
  all: ['encours'] as const,
  releve: (params: IEncoursParams) => [...encoursKeys.all, 'releve', params] as const,
  global: () => [...encoursKeys.all, 'global'] as const,
  groupes: () => [...encoursKeys.all, 'groupes'] as const,
  stores: (partenaire: string) => [...encoursKeys.all, 'stores', partenaire] as const,
  deductions: (annee: number) => [...encoursKeys.all, 'deductions', annee] as const,
  pertes: () => [...encoursKeys.all, 'pertes'] as const,
  statsPertes: (debut: string, fin: string) =>
    [...encoursKeys.all, 'pertes', 'stats', debut, fin] as const,
  categoriesPerte: () => [...encoursKeys.all, 'categories-perte'] as const,
};

/** Relevé des restes à payer (cascade Partenaire → Store + déductions). */
export const useEncoursQuery = (params: IEncoursParams) =>
  useQuery({
    queryKey: encoursKeys.releve(params),
    queryFn: () => encoursAPI.getReleve(params),
    enabled: !!params.annee,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Exposition globale : le bandeau de tête.
 *
 * <p>Requête SÉPARÉE du relevé, sans aucun paramètre. Les deux répondent à
 * deux questions : le relevé dit « ce que je regarde », celle-ci dit « où en
 * est l'entreprise ». Les mélanger, c'est ce qui faisait tomber le bandeau à
 * zéro dès qu'on filtrait sur un mois calme.</p>
 */
export const useEncoursGlobalQuery = () =>
  useQuery({
    queryKey: encoursKeys.global(),
    queryFn: () => encoursAPI.getGlobal(),
    staleTime: 5 * 60 * 1000,
  });

/** Les lignes de perte encore vivantes. Une ligne annulée ne compte plus nulle part. */
export const usePertesVolsQuery = () =>
  useQuery({
    queryKey: encoursKeys.pertes(),
    queryFn: () => encoursAPI.listerPertes(),
    staleTime: 60 * 1000,
  });

/** Le tableau de bord des pertes sur une fenêtre choisie. */
export const useStatistiquesPertesQuery = (debut: string, fin: string) =>
  useQuery({
    queryKey: encoursKeys.statsPertes(debut, fin),
    queryFn: () => encoursAPI.statistiquesPertes(debut, fin),
    enabled: Boolean(debut && fin),
    staleTime: 60 * 1000,
  });

/** Les motifs de perte, paramétrables côté serveur — pas un enum figé dans l'écran. */
export const useCategoriesPerteQuery = () =>
  useQuery({
    queryKey: encoursKeys.categoriesPerte(),
    queryFn: () => encoursAPI.categoriesPerte(),
    staleTime: 30 * 60 * 1000,
  });

/** Liste des groupes partenaires (pour le filtre). */
export const useEncoursGroupesQuery = () =>
  useQuery({
    queryKey: encoursKeys.groupes(),
    queryFn: () => encoursAPI.getGroupes(),
    staleTime: 30 * 60 * 1000,
  });

/** Points de vente d'un partenaire (filtre multi-sélection) — actif si un partenaire est choisi. */
export const useEncoursStoresQuery = (partenaire: string) =>
  useQuery({
    queryKey: encoursKeys.stores(partenaire),
    queryFn: () => encoursAPI.getStores(partenaire),
    enabled: !!partenaire,
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
