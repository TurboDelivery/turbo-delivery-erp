'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bddClientsAPI } from '../apis/bdd-clients.api';
import {
  IAppelSaisi,
  IEnregistrerLot,
  IFiltresClients,
  ILigneAVerifier,
} from '../types/bdd-clients.types';

export const bddClientsKeys = {
  all: ['bdd-clients'] as const,
  mesLots: () => [...bddClientsKeys.all, 'mes-lots'] as const,
  lot: (id: string) => [...bddClientsKeys.all, 'lot', id] as const,
  liste: (f: IFiltresClients) => [...bddClientsKeys.all, 'liste', f] as const,
  kpis: (f: IFiltresClients) => [...bddClientsKeys.all, 'kpis', f] as const,
  fiche: (id: string) => [...bddClientsKeys.all, 'fiche', id] as const,
};

/**
 * La fiche d'un client.
 *
 * <p>Sa clé ne contient PAS les filtres : la fiche d'un client est la même quel que soit
 * le filtre depuis lequel on l'a ouverte. L'y mettre rechargerait le panneau à chaque
 * changement de filtre derrière lui.</p>
 */
export const useFicheClientQuery = (id: string | null) =>
  useQuery({
    queryKey: bddClientsKeys.fiche(id ?? ''),
    queryFn: () => bddClientsAPI.fiche(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

/**
 * La liste et les cartes sont DEUX lectures.
 *
 * <p>Les cartes portent sur tout le résultat du filtre, la liste sur une page : les
 * calculer ensemble obligerait le serveur à parcourir l'ensemble pour rendre vingt-cinq
 * lignes. Séparées, la page se pagine et les cartes se mettent en cache à part — changer
 * de page ne les recalcule pas.</p>
 */
export const useClientsQuery = (filtres: IFiltresClients) =>
  useQuery({
    queryKey: bddClientsKeys.liste(filtres),
    queryFn: () => bddClientsAPI.lister(filtres),
    placeholderData: (precedent) => precedent,
    staleTime: 30_000,
  });

export const useKpisClientsQuery = (filtres: IFiltresClients) =>
  useQuery({
    queryKey: bddClientsKeys.kpis(filtres),
    queryFn: () => bddClientsAPI.kpis(filtres),
    staleTime: 60_000,
  });

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

/**
 * Enregistre un appel.
 *
 * <p>Tout est invalidé : un appel change le statut de la fiche, donc la liste, les cartes
 * et la fiche elle-même. Invalider finement ici laisserait un écran qui contredit
 * l'autre.</p>
 */
export const useQualifierMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: ({ clientId, appel }: { clientId: string; appel: IAppelSaisi }) =>
      bddClientsAPI.qualifier(clientId, appel),
    onSuccess: (resultat) => {
      invalidate();
      if (resultat.alerteQualite) {
        toast.warning(resultat.message);
        return;
      }
      toast.success(resultat.message);
    },
    onError: (erreur: Error) => toast.error(erreur.message),
  });
};

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
