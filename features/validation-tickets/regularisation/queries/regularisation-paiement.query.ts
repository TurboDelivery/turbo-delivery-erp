'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  approuverLotRegulApi,
  genererLotRegularisationApi,
  getRecapRegularisationApi,
  soumettreLotRegulApi,
  viserLotRegulApi,
} from '../apis/regularisation-paiement.api';

const recapKey = (creneauId?: string) => ['regularisation-recap', creneauId ?? ''] as const;

export const useRecapRegularisationQuery = (creneauId?: string) =>
  useQuery({
    queryKey: recapKey(creneauId),
    queryFn: () => getRecapRegularisationApi(creneauId as string),
    enabled: !!creneauId,
    staleTime: 15 * 1000,
  });

const serverMsg = (error: any) =>
  String(error?.response?.data?.message ?? error?.response?.data ?? error?.message ?? 'Erreur inconnue');

/** Fabrique commune : mutation d'étape de la chaîne + invalidation du recap. */
function useEtapeLotMutation(
  fn: (lotId: string, userId: string) => Promise<void>,
  okTitre: string,
  koTitre: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, userId }: { lotId: string; userId: string; creneauId: string }) =>
      fn(lotId, userId),
    onSuccess: (_d, v) => {
      toast.success(okTitre);
      queryClient.invalidateQueries({ queryKey: recapKey(v.creneauId) });
    },
    onError: (error: any) => toast.error(koTitre, { description: serverMsg(error) }),
  });
}

export const useGenererLotRegulMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creneauId, userId }: { creneauId: string; userId: string }) =>
      genererLotRegularisationApi(creneauId, userId),
    onSuccess: (data, v) => {
      toast.success('Lot de régularisation prêt', {
        description: `${data.lignes.length} livreur(s) — vous pouvez soumettre au DGA.`,
      });
      queryClient.setQueryData(recapKey(v.creneauId), data);
    },
    onError: (error: any) => toast.error('Génération impossible', { description: serverMsg(error) }),
  });
};

export const useSoumettreLotRegulMutation = () =>
  useEtapeLotMutation(soumettreLotRegulApi, 'Lot de régularisation soumis au DGA', 'Soumission impossible');

export const useViserLotRegulMutation = () =>
  useEtapeLotMutation(viserLotRegulApi, 'Lot visé — transmis pour approbation finale', 'Visa impossible');

export const useApprouverLotRegulMutation = () =>
  useEtapeLotMutation(
    approuverLotRegulApi,
    'Lot approuvé — paiements Wave déclenchés',
    'Approbation impossible',
  );
