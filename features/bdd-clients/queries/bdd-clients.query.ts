'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bddClientsAPI } from '../apis/bdd-clients.api';
import {
  IAppelSaisi,
  IEnregistrerLot,
  IFiltresClients,
  ILigneAVerifier,
  IModificationFiche,
} from '../types/bdd-clients.types';

export const bddClientsKeys = {
  all: ['bdd-clients'] as const,
  mesLots: () => [...bddClientsKeys.all, 'mes-lots'] as const,
  lot: (id: string) => [...bddClientsKeys.all, 'lot', id] as const,
  liste: (f: IFiltresClients) => [...bddClientsKeys.all, 'liste', f] as const,
  kpis: (f: IFiltresClients) => [...bddClientsKeys.all, 'kpis', f] as const,
  fiche: (id: string) => [...bddClientsKeys.all, 'fiche', id] as const,
  doublons: () => [...bddClientsKeys.all, 'doublons'] as const,
  journalFusions: () => [...bddClientsKeys.all, 'journal-fusions'] as const,
  listeNoire: () => [...bddClientsKeys.all, 'liste-noire'] as const,
  statsPartenaires: (debut: string, fin: string) =>
    [...bddClientsKeys.all, 'stats-partenaires', debut, fin] as const,
  voisinsPartenaire: (id: string, debut: string, fin: string) =>
    [...bddClientsKeys.all, 'voisins', id, debut, fin] as const,
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

/* ─────────────────────────────────────────────────────────────────────────────
   Fusion de doublons
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Les doublons probables.
 *
 * <p>Sans mise en cache longue : la liste change dès qu'une fusion aboutit, et une
 * liste périmée proposerait de fusionner une fiche qui vient de l'être.</p>
 */
export const useDoublonsQuery = (actif = true) =>
  useQuery({
    queryKey: bddClientsKeys.doublons(),
    queryFn: () => bddClientsAPI.doublons(),
    enabled: actif,
    staleTime: 0,
  });

/** Le journal des fusions : c'est par lui qu'on retrouve une fusion pour l'annuler. */
export const useJournalFusionsQuery = (actif = true) =>
  useQuery({
    queryKey: bddClientsKeys.journalFusions(),
    queryFn: () => bddClientsAPI.journalFusions(),
    enabled: actif,
    staleTime: 0,
  });

/**
 * Fusionne deux fiches.
 *
 * <p>Tout est invalidé : une fusion change les compteurs des deux fiches, la liste, les
 * cartes et le journal. Invalider finement laisserait un écran qui contredit l'autre.</p>
 */
export const useFusionnerMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: ({ sourceId, cibleId }: { sourceId: string; cibleId: string }) =>
      bddClientsAPI.fusionner(sourceId, cibleId),
    onSuccess: (bilan) => {
      invalidate();
      toast.success(bilan.message);
    },
    onError: (erreur: Error) => toast.error(erreur.message),
  });
};

/** Défait une fusion. Le motif est obligatoire, le serveur le refuse vide. */
export const useAnnulerFusionMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: ({ fusionId, motif }: { fusionId: string; motif: string }) =>
      bddClientsAPI.annulerFusion(fusionId, motif),
    onSuccess: (bilan) => {
      invalidate();
      toast.success(bilan.message);
    },
    onError: (erreur: Error) => toast.error(erreur.message),
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   Correction d'une fiche et liste noire
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Corrige une fiche.
 *
 * <p>Tout est invalidé : un nom corrigé change la liste, un segment posé à la main
 * change les cartes, et le rapprochement des doublons se fait sur le nom. Invalider
 * finement laisserait un écran qui contredit l'autre.</p>
 */
export const useModifierFicheMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: ({
      clientId,
      modification,
    }: {
      clientId: string;
      modification: IModificationFiche;
    }) => bddClientsAPI.modifier(clientId, modification),
    onSuccess: (bilan) => {
      invalidate();
      if (bilan.champsModifies.length === 0) {
        toast.info(bilan.message);
        return;
      }
      toast.success(bilan.message);
    },
    onError: (erreur: Error) => toast.error(erreur.message),
  });
};

/** Les numéros qui ne sont pas des clients. */
export const useListeNoireQuery = (actif = true) =>
  useQuery({
    queryKey: bddClientsKeys.listeNoire(),
    queryFn: () => bddClientsAPI.listeNoire(),
    enabled: actif,
    staleTime: 0,
  });

/** Inscrit un numéro. Le bilan dit combien de commandes sortent des classements. */
export const useInscrireListeNoireMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: ({
      telephone,
      libelle,
      motif,
    }: {
      telephone: string;
      libelle: string;
      motif: string | null;
    }) => bddClientsAPI.inscrireEnListeNoire(telephone, libelle, motif),
    onSuccess: (bilan) => {
      invalidate();
      toast.success(bilan.message);
    },
    onError: (erreur: Error) => toast.error(erreur.message),
  });
};

/** Retire un numéro, et rend la fiche que cette liste avait retirée. */
export const useRetirerListeNoireMutation = () => {
  const invalidate = useInvalidateBddClients();
  return useMutation({
    mutationFn: (telephone: string) => bddClientsAPI.retirerDeLaListeNoire(telephone),
    onSuccess: (bilan) => {
      invalidate();
      toast.success(bilan.message);
    },
    onError: (erreur: Error) => toast.error(erreur.message),
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   Statistiques par partenaire
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Le tableau des partenaires.
 *
 * <p>La clé porte la période : c'est ce qui change le résultat, et deux périodes ne
 * doivent pas se recouvrir en cache. Une minute de fraîcheur suffit — ces chiffres
 * bougent au rythme des lots, pas des clics.</p>
 */
export const useStatsPartenairesQuery = (debut: string, fin: string) =>
  useQuery({
    queryKey: bddClientsKeys.statsPartenaires(debut, fin),
    queryFn: () => bddClientsAPI.statsPartenaires(debut, fin),
    placeholderData: (precedent) => precedent,
    staleTime: 60_000,
  });

/** Avec qui un partenaire partage son audience. Lu à l'ouverture du détail, pas avant. */
export const useVoisinsPartenaireQuery = (id: string | null, debut: string, fin: string) =>
  useQuery({
    queryKey: bddClientsKeys.voisinsPartenaire(id ?? '', debut, fin),
    queryFn: () => bddClientsAPI.voisinsPartenaire(id as string, debut, fin),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
