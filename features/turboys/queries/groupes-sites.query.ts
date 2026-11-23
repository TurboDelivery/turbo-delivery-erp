'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { groupesSitesAPI } from '@/features/turboys/apis/groupes-sites.api';
import type { IGroupeSitesPayload } from '@/features/turboys/types/programme.types';

/**
 * Secteurs et couvertures (§8.5, §8.6).
 *
 * <p>Appel DIRECT au backend, sans action serveur : ces lectures et écritures n'ont
 * besoin ni de session serveur ni de revalidation de page, et le détour coûterait un
 * aller-retour de plus à chaque frappe dans le champ de recherche.</p>
 */

export type GenreGroupe = 'secteurs' | 'couvertures';

export const groupesSitesKeys = {
  all: ['groupes-sites'] as const,
  liste: (genre: GenreGroupe) => [...groupesSitesKeys.all, genre] as const,
};

const messageErreur = (error: unknown) => (error instanceof Error ? error.message : 'Erreur inconnue');

const libelle = (genre: GenreGroupe) => (genre === 'secteurs' ? 'Secteur' : 'Couverture');

export const useGroupesSitesQuery = (genre: GenreGroupe) =>
  useQuery({
    queryKey: groupesSitesKeys.liste(genre),
    queryFn: () => groupesSitesAPI.lister(genre),
    // Ces groupes changent rarement et sont lus par toute la page : cinq minutes
    // évitent de les relire à chaque navigation de semaine.
    staleTime: 5 * 60 * 1000,
  });

export const useEnregistrerGroupeMutation = (genre: GenreGroupe, onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: IGroupeSitesPayload }) =>
      id ? groupesSitesAPI.modifier(genre, id, payload) : groupesSitesAPI.creer(genre, payload),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: groupesSitesKeys.all });
      toast.success(`${libelle(genre)} ${variables.id ? 'enregistré' : 'créé'}.`);
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const useSupprimerGroupeMutation = (genre: GenreGroupe, onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupesSitesAPI.supprimer(genre, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: groupesSitesKeys.all });
      // Le message dit ce qui N'A PAS été supprimé : la question que se pose
      // l'opérateur juste après avoir cliqué sur « Supprimer ».
      toast.success(
        `${libelle(genre)} supprimé. Ses sites restent, ils passent « Sans ${genre === 'secteurs' ? 'secteur' : 'couverture'} ».`,
      );
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};
