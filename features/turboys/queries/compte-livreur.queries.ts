'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { turboyKeys } from '@/features/turboys/queries/turboy-list.query';
import {
  changerStatutPieceAction,
  emettreCleAction,
  listerClesAction,
  listerEvenementsAction,
  validerCompteAction,
} from '@/features/turboys/actions/compte-livreur.actions';
import {
  ChangerStatutPieceDTO,
  EmissionCle,
  ValiderCompteDTO,
  ValidationCompteVm,
} from '@/features/turboys/types/compte-livreur.types';

export const compteLivreurKeys = {
  all: ['compte-livreur'] as const,
  cles: (id: string) => [...compteLivreurKeys.all, 'cles', id] as const,
  evenements: (id: string) => [...compteLivreurKeys.all, 'evenements', id] as const,
};

export const useClesQuery = (id: string) =>
  useQuery({
    queryKey: compteLivreurKeys.cles(id),
    queryFn: () => listerClesAction(id),
    enabled: !!id,
    staleTime: 0,
  });

export const useEvenementsQuery = (id: string) =>
  useQuery({
    queryKey: compteLivreurKeys.evenements(id),
    queryFn: () => listerEvenementsAction(id),
    enabled: !!id,
    staleTime: 0,
  });

export const useValiderCompteMutation = (id: string, onDone?: (vm: ValidationCompteVm) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ValiderCompteDTO) => {
      const result = await validerCompteAction(id, dto);
      if (!result.success) throw new Error(result.error || 'Erreur lors de la validation du compte');
      return result.data!;
    },
    onSuccess: async (vm) => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: compteLivreurKeys.cles(id) });
      await queryClient.invalidateQueries({ queryKey: compteLivreurKeys.evenements(id) });
      toast.success('Compte validé. Clé d’activation générée.');
      onDone?.(vm);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur lors de la validation'),
  });
};

export const useChangerStatutPieceMutation = (id: string, onDone?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ChangerStatutPieceDTO) => {
      const result = await changerStatutPieceAction(id, dto);
      if (!result.success) throw new Error(result.error || 'Erreur lors de la mise à jour de la pièce');
      return result.data!;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: compteLivreurKeys.evenements(id) });
      toast.success('Statut de la pièce mis à jour.');
      onDone?.();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour'),
  });
};

export const useEmettreCleMutation = (id: string, onDone?: (cle: EmissionCle) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (motif?: string) => {
      const result = await emettreCleAction(id, motif);
      if (!result.success) throw new Error(result.error || 'Erreur lors de l’émission de la clé');
      return result.data!;
    },
    onSuccess: async (cle) => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: compteLivreurKeys.cles(id) });
      await queryClient.invalidateQueries({ queryKey: compteLivreurKeys.evenements(id) });
      toast.success('Nouvelle clé d’activation émise.');
      onDone?.(cle);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erreur lors de l’émission'),
  });
};
