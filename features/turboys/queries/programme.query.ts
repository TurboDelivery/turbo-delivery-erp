'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  listerProgrammesSemaineAction,
  creerProgrammeAction,
  modifierProgrammeAction,
  planifierProgrammeAction,
  publierProgrammeAction,
} from '@/features/turboys/actions/programme.actions';
import { ICreerProgrammePayload, IModifierProgrammePayload } from '@/features/turboys/types/programme.types';

export const programmeKeys = {
  all: ['programme'] as const,
  semaine: (annee: number, semaine: number) => [...programmeKeys.all, 'semaine', annee, semaine] as const,
};

export const useProgrammesSemaineQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.semaine(annee, semaine),
    queryFn: () => listerProgrammesSemaineAction(annee, semaine),
    enabled: !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

const messageErreur = (error: unknown) => (error instanceof Error ? error.message : 'Erreur inconnue');

export const useCreerProgrammeMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ICreerProgrammePayload) => {
      const r = await creerProgrammeAction(payload);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la création du programme');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Programme créé (brouillon).');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const useModifierProgrammeMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IModifierProgrammePayload) => {
      const r = await modifierProgrammeAction(payload);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la modification du programme');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Programme mis à jour.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const usePlanifierProgrammeMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await planifierProgrammeAction(id);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la planification');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Programme planifié.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const usePublierProgrammeMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await publierProgrammeAction(id);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la publication');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Programme publié — le livreur est notifié.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};
