'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bddClientsAPI } from '../apis/bdd-clients.api';
import { IEnregistrerLot, ILigneAVerifier } from '../types/bdd-clients.types';

export const bddClientsKeys = {
  all: ['bdd-clients'] as const,
  mesLots: () => [...bddClientsKeys.all, 'mes-lots'] as const,
  lot: (id: string) => [...bddClientsKeys.all, 'lot', id] as const,
};

/** Les lots de l'agent. Une seule fonction d'invalidation pour tout le module. */
export const useMesLotsQuery = () =>
  useQuery({
    queryKey: bddClientsKeys.mesLots(),
    queryFn: () => bddClientsAPI.mesLots(),
    staleTime: 30_000,
  });

export const useLotQuery = (lotId: string | null) =>
  useQuery({
    queryKey: bddClientsKeys.lot(lotId ?? ''),
    queryFn: () => bddClientsAPI.rouvrir(lotId as string),
    enabled: Boolean(lotId),
  });

export const useInvalidateBddClients = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: bddClientsKeys.all });
};

/**
 * Le contrôle groupé.
 *
 * <p>C'est une mutation et non une requête : elle n'est pas déclenchée par un état
 * d'écran mais par un GESTE (un collage, une sortie de champ), et son résultat ne se
 * met pas en cache — la base bouge entre deux saisies.</p>
 */
export const useVerifierLotMutation = () =>
  useMutation({
    mutationFn: ({ partenaireId, lignes }: { partenaireId: string; lignes: ILigneAVerifier[] }) =>
      bddClientsAPI.verifier(partenaireId, lignes),
  });

export const useEnregistrerLotMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: (dto: IEnregistrerLot) => bddClientsAPI.enregistrer(dto),
    onSuccess: (synthese) => {
      invalidate();
      const detail =
        `${synthese.nbEnregistrees} enregistrée${synthese.nbEnregistrees > 1 ? 's' : ''}` +
        ` · ${synthese.nbNouveaux} nouveau${synthese.nbNouveaux > 1 ? 'x' : ''} client${synthese.nbNouveaux > 1 ? 's' : ''}` +
        ` · ${synthese.nbRattachees} rattachée${synthese.nbRattachees > 1 ? 's' : ''}`;
      if (synthese.nbErreurs > 0) {
        toast.warning(`${detail} · ${synthese.nbErreurs} en erreur`);
        return;
      }
      toast.success(detail);
    },
  });
};
