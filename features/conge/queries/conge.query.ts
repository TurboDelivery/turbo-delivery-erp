import { useQuery } from '@tanstack/react-query';
import { congeAPI } from '../apis/conge.api';
import { ICongesParams } from '../types/conge.type';
import React from 'react';

// Query keys
export const congeQueryKeys = {
  all: ['conges'] as const,
  lists: () => [...congeQueryKeys.all, 'list'] as const,
  list: (params: ICongesParams) => [...congeQueryKeys.lists(), params] as const,
  details: () => [...congeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...congeQueryKeys.details(), id] as const,
  employee: (employeeId: string) => [...congeQueryKeys.all, 'employee', employeeId] as const,
};

// Get all conges
export const useCongesQuery = (params: ICongesParams = {}) => {
  const query = useQuery({
    queryKey: congeQueryKeys.list(params),
    queryFn: async () => {
      return await congeAPI.obtenirTousConges(params);
    },
    placeholderData: (previousData: any) => previousData,
    staleTime: 30 * 1000, //30 secondes
    refetchOnMount: true, //Refetch lors du mount
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error('Erreur lors de la récupération des congés:', query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query]);

  return query;
};

// Get single conge
export const useCongeQuery = (id: string) => {
  const query = useQuery({
    queryKey: congeQueryKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("L'identifiant du congé est requis");
      return await congeAPI.obtenirConge(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error('Erreur lors de la récupération du congé:', query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query.isError, query.error]);

  return query;
};

// Get conges by employee
export const useCongesByEmployeeQuery = (employeeId: string) => {
  const query = useQuery({
    queryKey: congeQueryKeys.employee(employeeId),
    queryFn: async () => {
      if (!employeeId) throw new Error("L'identifiant de l'employé est requis");
      return await congeAPI.obtenirCongesParEmploye(employeeId);
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error("Erreur lors de la récupération des congés de l'employé:", query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query.isError, query.error]);

  return query;
};

export const eligibleEmployeeQuery = (params: ICongesParams) => {
  const query = useQuery({
    queryKey: ['eligible', params],
    queryFn: async () => {
      return await congeAPI.obtenirEmployeEligible(params);
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnMount: true, //Refetch lors du mount
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error('Erreur lors de la récupération des employés éligibles:', query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query.isError, query.error]);

  return query;
};
export const useStatistiquesCongesQuery = () => {
  const query = useQuery({
    queryKey: ['statistiques-conges'],
    queryFn: async () => {
      return await congeAPI.obtenirStatistiquesConges();
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnMount: true, //Refetch lors du mount
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error('Erreur lors de la récupération des statistiques des congés:', query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query.isError, query.error]);

  return query;
};
export const useStatistiquesCongesQuery = () => {
  const query = useQuery({
    queryKey: ['statistiques-conges'],
    queryFn: async () => {
      return await congeAPI.obtenirStatistiquesConges();
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnMount: true, //Refetch lors du mount
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error("Erreur lors de la récupération des statistiques des congés:", query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query.isError, query.error]);

  return query;
};