'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getFichePaieApi,
  getGrillePaiementApi,
  modifierInclusionLigneApi,
  soumettreDgaApi,
  soumettrGrillePaiementApi,
  updateNumeroWaveApi,
  validerLigneApi,
} from '../apis/grille-paiement.api';
import {
  IGrillePaiementParams,
  IModifierInclusionParams,
  IUpdateNumeroWaveParams,
} from '../types/grille-paiement.type';

export const grillePaiementKeys = {
  all: ['grille-paiement'] as const,
  detail: (params?: IGrillePaiementParams) => [...grillePaiementKeys.all, params?.creneauId, params?.page ?? 0] as const,
  fichePaie: (livreurId: string, lotId: string) => [...grillePaiementKeys.all, 'fiche-paie', livreurId, lotId] as const,
};

export const useGrillePaiementQuery = (params?: IGrillePaiementParams) => {
  const query = useQuery({
    queryKey: grillePaiementKeys.detail(params),
    queryFn: () => getGrillePaiementApi(params),
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors du chargement de la grille de paiement', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};

export const useFichePaieQuery = (livreurId: string | null, lotId: string | undefined) => {
  return useQuery({
    queryKey: grillePaiementKeys.fichePaie(livreurId ?? '', lotId ?? ''),
    queryFn: () => getFichePaieApi(livreurId!, lotId!),
    enabled: !!livreurId && !!lotId,
    staleTime: 60_000,
  });
};

/**
 * Soumission Comptable au DGA — orchestre les DEUX transitions backend que
 * l'UI omettait (d'où "Point 8 ne fonctionne" : le lot restait en
 * CALCUL_EN_COURS et n'atteignait jamais le DGA) :
 *   1. POST /creneaux/{id}/soumettre    → EN_ATTENTE|REJETE → CALCUL_EN_COURS
 *   2. POST /lots/{lotId}/soumettre-dga → CALCUL_EN_COURS   → SOUMIS_DGA
 * Si le lot est DÉJÀ en CALCUL_EN_COURS (lots historiquement bloqués par
 * l'ancien bug), on saute l'étape 1 et on enchaîne direct sur l'étape 2 →
 * auto-réparation des lots coincés.
 */
export const useSoumettreGrilleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      creneauId,
      lotId,
      statut,
      userId,
    }: {
      creneauId: string;
      lotId?: string;
      statut?: string;
      userId: string;
    }) => {
      let resolvedLotId = lotId;
      // Étape 1 sautée uniquement si le lot est déjà en CALCUL_EN_COURS.
      if (statut !== 'CALCUL_EN_COURS') {
        const lot = await soumettrGrillePaiementApi(creneauId, userId);
        resolvedLotId = lot?.id ?? lotId;
      }
      if (!resolvedLotId) {
        throw new Error('Lot introuvable pour ce créneau — soumission au DGA impossible.');
      }
      // Étape 2 : transition qui expose réellement le lot au DGA (SOUMIS_DGA).
      await soumettreDgaApi(resolvedLotId, userId);
    },
    onSuccess: () => {
      toast.success('Grille soumise au DGA avec succès');
      queryClient.invalidateQueries({ queryKey: grillePaiementKeys.all });
    },
    onError: (error: any) => {
      const serverMsg = error?.response?.data?.message ?? error?.response?.data ?? null;
      toast.error('Erreur lors de la soumission', {
        description: serverMsg ? String(serverMsg) : error?.message ?? 'Erreur inconnue',
      });
    },
  });
};

export const useValiderLigneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, turboyId, userId }: { lotId: string; turboyId: string; userId: string }) =>
      validerLigneApi(lotId, turboyId, userId),
    onSuccess: () => {
      toast.success('Ligne validée avec succès');
      queryClient.invalidateQueries({ queryKey: grillePaiementKeys.all });
    },
    onError: (error: any) => {
      const serverMsg = error?.response?.data?.message ?? null;
      toast.error('Erreur lors de la validation', {
        description: serverMsg ?? error?.message ?? 'Erreur inconnue',
      });
    },
  });
};

/**
 * V54 (2026-05) — Mutation Comptable : override inclusion ligne dans le
 * "Total à payer". Affiche un toast spécial si le backend retourne
 * {@code reSoumissionRequise=true} (lot remis en CALCUL_EN_COURS).
 */
export const useModifierInclusionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ params, userId }: { params: IModifierInclusionParams; userId: string }) =>
      modifierInclusionLigneApi(params, userId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: grillePaiementKeys.all });
      if (response.reSoumissionRequise) {
        toast.warning('Le lot a été remis en calcul', {
          description:
            'L\'inclusion a changé après approbation — re-soumission au DGA requise.',
          duration: 8000,
        });
      } else {
        toast.success(
          response.inclusDansPaie
            ? 'Ligne incluse dans le paiement'
            : 'Ligne exclue du paiement',
        );
      }
    },
    onError: (error: any) => {
      const serverMsg = error?.response?.data?.message ?? error?.response?.data ?? null;
      toast.error('Erreur lors de la modification de l\'inclusion', {
        description: serverMsg ? String(serverMsg) : error?.message ?? 'Erreur inconnue',
      });
    },
  });
};

export const useUpdateNumeroWaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IUpdateNumeroWaveParams) => updateNumeroWaveApi(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grillePaiementKeys.all });
      toast.success('Numéro Wave mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du numéro Wave', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
