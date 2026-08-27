'use client';

import { useMutation, useQuery, useQueryClient , keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';

import { groupesPartenairesAPI } from '../apis/groupes-partenaires.api';
import { ICreerGroupePayload } from '../types/groupes-partenaires.types';

export const groupesPartenairesKeys = {
  all: ['groupes-partenaires'] as const,
  liste: () => [...groupesPartenairesKeys.all, 'liste'] as const,
  detail: (groupeId: string) => [...groupesPartenairesKeys.all, 'detail', groupeId] as const,
  etablissements: (recherche: string) =>
    [...groupesPartenairesKeys.all, 'etablissements', recherche] as const,
};

/**
 * Le message que le backend a réellement écrit, quand il en a écrit un.
 *
 * Les refus de ce module sont des phrases métier utiles à l'administrateur
 * (« Ce restaurant appartient déjà à un autre groupe ») : les remplacer par un
 * « Erreur inconnue » générique lui retirerait la seule information exploitable.
 */
const messageServeur = (error: unknown, defaut: string): string => {
  const reponse = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof reponse === 'string' && reponse.trim()) return reponse;
  const message = (reponse as { message?: string })?.message;
  if (message) return message;
  return error instanceof Error && error.message ? error.message : defaut;
};

// ─────────────────────────────────────────────────────────────────────────────
// Lectures
// ─────────────────────────────────────────────────────────────────────────────

export const useGroupesListeQuery = (userId: string) =>
  useQuery({
    queryKey: groupesPartenairesKeys.liste(),
    queryFn: () => groupesPartenairesAPI.lister(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

export const useGroupeDetailQuery = (groupeId: string | null, userId: string) =>
  useQuery({
    queryKey: groupesPartenairesKeys.detail(groupeId ?? ''),
    queryFn: () => groupesPartenairesAPI.detail(groupeId as string, userId),
    enabled: !!groupeId && !!userId,
    staleTime: 30 * 1000,
  });

/**
 * Le catalogue d'établissements du sélecteur.
 *
 * `enabled` sur `actif` : la liste porte les comptes de CHAQUE établissement, elle
 * n'a donc rien à faire tant que l'assistant de constitution n'est pas ouvert.
 * `keepPreviousData` évite que la liste disparaisse entre deux frappes de recherche.
 */
export const useEtablissementsCandidatsQuery = (userId: string, recherche: string, actif: boolean) =>
  useQuery({
    queryKey: groupesPartenairesKeys.etablissements(recherche),
    queryFn: () => groupesPartenairesAPI.etablissements(userId, recherche),
    enabled: !!userId && actif,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

// ─────────────────────────────────────────────────────────────────────────────
// Écritures
// ─────────────────────────────────────────────────────────────────────────────

export const useCreerGroupeMutation = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreerGroupePayload) => groupesPartenairesAPI.creer(payload, userId),
    onSuccess: (groupe) => {
      queryClient.setQueryData(groupesPartenairesKeys.detail(groupe.id), groupe);
      queryClient.invalidateQueries({ queryKey: groupesPartenairesKeys.all });
      toast.success(`Groupe « ${groupe.nom} » constitué`);
    },
    onError: (error) =>
      toast.error('Constitution impossible', {
        description: messageServeur(error, 'Le groupe n’a pas été créé.'),
      }),
  });
};

export const useDetacherEtablissementMutation = (groupeId: string, userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) =>
      groupesPartenairesAPI.detacher(groupeId, restaurantId, userId),
    onSuccess: (groupe) => {
      queryClient.setQueryData(groupesPartenairesKeys.detail(groupe.id), groupe);
      queryClient.invalidateQueries({ queryKey: groupesPartenairesKeys.all });
      toast.success('Établissement détaché du groupe');
    },
    onError: (error) =>
      toast.error('Détachement impossible', {
        description: messageServeur(error, 'L’établissement est resté rattaché.'),
      }),
  });
};

export const useRattacherEtablissementMutation = (groupeId: string, userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) =>
      groupesPartenairesAPI.rattacher(groupeId, restaurantId, userId),
    onSuccess: (groupe) => {
      queryClient.setQueryData(groupesPartenairesKeys.detail(groupe.id), groupe);
      queryClient.invalidateQueries({ queryKey: groupesPartenairesKeys.all });
      toast.success('Établissement rattaché au groupe');
    },
    onError: (error) =>
      toast.error('Rattachement impossible', {
        description: messageServeur(error, 'L’établissement n’a pas été rattaché.'),
      }),
  });
};

export const useChangerProprietaireMutation = (groupeId: string, userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nouveauProprietaireUserId: string) =>
      groupesPartenairesAPI.changerProprietaire(groupeId, userId, nouveauProprietaireUserId),
    onSuccess: (groupe) => {
      queryClient.setQueryData(groupesPartenairesKeys.detail(groupe.id), groupe);
      queryClient.invalidateQueries({ queryKey: groupesPartenairesKeys.all });
      toast.success('Compte principal modifié');
    },
    onError: (error) =>
      toast.error('Changement impossible', {
        description: messageServeur(error, 'Le compte principal n’a pas changé.'),
      }),
  });
};
