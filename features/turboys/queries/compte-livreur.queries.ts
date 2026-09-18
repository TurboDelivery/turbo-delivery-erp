'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { turboyKeys } from '@/features/turboys/queries/turboy-list.query';
import {
  changerStatutPieceAction,
  effacerCodeAction,
  emettreCleAction,
  listerClesAction,
  listerCoteAction,
  listerEvenementsAction,
  validerCompteAction,
} from '@/features/turboys/actions/compte-livreur.actions';
import {
  ChangerStatutPieceDTO,
  EffacementCode,
  EmissionCle,
  ValiderCompteDTO,
  ValidationCompteVm,
} from '@/features/turboys/types/compte-livreur.types';

export const compteLivreurKeys = {
  all: ['compte-livreur'] as const,
  cles: (id: string) => [...compteLivreurKeys.all, 'cles', id] as const,
  evenements: (id: string) => [...compteLivreurKeys.all, 'evenements', id] as const,
  cote: (id: string) => [...compteLivreurKeys.all, 'cote', id] as const,
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

export const useCoteQuery = (id: string) =>
  useQuery({
    queryKey: compteLivreurKeys.cote(id),
    queryFn: () => listerCoteAction(id),
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

/**
 * Efface le code d'accès du livreur.
 *
 * Le serveur répond 200 avec `reinitialise: false` quand il n'a rien effacé. Traiter ce
 * cas comme un succès ferait raccrocher l'agent en croyant le compte débloqué : on lève.
 *
 * L'historique du compte est invalidé, pas seulement la fiche : c'est là que le geste se
 * relit après coup.
 */
export const useEffacerCodeMutation = (id: string, onDone?: (r: EffacementCode) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await effacerCodeAction(id);
      if (!result.success) throw new Error(result.error || 'Erreur lors de l’effacement du code');
      if (result.data?.reinitialise === false) {
        throw new Error(result.data.message || 'Le code n’a pas été effacé.');
      }
      return result.data!;
    },
    onSuccess: async (resultat) => {
      await queryClient.invalidateQueries({ queryKey: turboyKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: compteLivreurKeys.evenements(id) });
      toast.success(
        resultat.telephone
          ? `Code effacé. Le coursier en repose un depuis le ${resultat.telephone}.`
          : resultat.message || 'Code effacé.',
      );
      onDone?.(resultat);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l’effacement du code'),
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
