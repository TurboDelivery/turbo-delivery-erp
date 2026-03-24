import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { congeAPI, ICongeAPI } from '../apis/conge.api';
import { IConge, ICongesParams } from '../types/conge.type';
import { CongeAddDTO, CongeUpdateDTO, CongeStatusUpdateDTO } from '../schema';

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
  return useQuery({
    queryKey: congeQueryKeys.list(params),
    queryFn: () => congeAPI.obtenirTousConges(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single conge
export const useCongeQuery = (id: string) => {
  return useQuery({
    queryKey: congeQueryKeys.detail(id),
    queryFn: () => congeAPI.obtenirConge(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get conges by employee
export const useCongesByEmployeeQuery = (employeeId: string) => {
  return useQuery({
    queryKey: congeQueryKeys.employee(employeeId),
    queryFn: () => congeAPI.obtenirCongesParEmploye(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create conge mutation
export const useCreateCongeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CongeAddDTO) => congeAPI.ajouterConge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.lists() });
    },
  });
};

// Update conge mutation
export const useUpdateCongeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CongeUpdateDTO }) => 
      congeAPI.modifierConge(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.detail(id) });
    },
  });
};

// Delete conge mutation
export const useDeleteCongeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => congeAPI.supprimerConge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.lists() });
    },
  });
};

// Approve conge mutation
export const useApproveCongeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CongeStatusUpdateDTO }) => 
      congeAPI.approuverConge(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.detail(id) });
    },
  });
};

// Reject conge mutation
export const useRejectCongeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CongeStatusUpdateDTO }) => 
      congeAPI.rejeterConge(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: congeQueryKeys.detail(id) });
    },
  });
};
