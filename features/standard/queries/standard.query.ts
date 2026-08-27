'use client';

import { useMutation, useQuery, useQueryClient , keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { standardAPI } from '../apis/standard.api';
import { IAccepterAppel, IAppelConfig, IChangerStatutIncident, ICreerMotifIncident, IInitierAppel, IModifierMotifIncident, StatutIncident } from '../types/standard.types';

/** Cadence de rafraîchissement du poste STANDARD : c'est un écran d'urgence. */
export const STANDARD_REFRESH_MS = 30 * 1000;

export const standardKeys = {
  all: ['standard'] as const,
  // `size` fait partie de la clé : la console lit la MÊME page 0 avec deux
  // tailles différentes (file d'urgence large, historique paginé court) — sans
  // lui, les deux requêtes se partageraient un cache et se tronqueraient l'une
  // l'autre.
  incidents: (statut?: StatutIncident, page?: number, size?: number) =>
    [...standardKeys.all, 'incidents', statut ?? 'TOUS', page ?? 0, size ?? 20] as const,
  incident: (id: string) => [...standardKeys.all, 'incident', id] as const,
  ouverts: () => [...standardKeys.all, 'ouverts'] as const,
  motifs: () => [...standardKeys.all, 'motifs'] as const,
  // `size` entre dans la clé, pour la même raison que dans `incidents` juste au-dessus :
  // trois écrans lisent ce journal avec trois tailles (15, 50 et 30). Sans `size`, ils
  // partageaient une seule entrée de cache et la taille réellement envoyée était celle
  // du dernier observateur monté — le panneau « appels manqués » pouvait donc recevoir
  // 15 lignes au lieu de 50 et masquer des appels manqués.
  appels: (page?: number, userId?: string, size?: number) =>
    [...standardKeys.all, 'appels', page ?? 0, userId ?? 'tous', size ?? 20] as const,
  appelsEntrants: () => [...standardKeys.all, 'appels-entrants'] as const,
  appelsEnCours: () => [...standardKeys.all, 'appels-en-cours'] as const,
  appelConfig: () => [...standardKeys.all, 'appel-config'] as const,
  traficLivreurs: () => [...standardKeys.all, 'trafic-livreurs'] as const,
};

/**
 * File d'incidents. `refetchInterval` sert la veille temps réel de la console ;
 * `enabled` permet de ne charger l'historique qu'une fois la section dépliée.
 */
export const useIncidentsQuery = (
  statut: StatutIncident | undefined,
  page: number,
  size = 20,
  options?: { refetchInterval?: number; enabled?: boolean },
) =>
  useQuery({
    queryKey: standardKeys.incidents(statut, page, size),
    queryFn: () => standardAPI.listerIncidents({ statut, page, size }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? false,
    // Le poste STANDARD est souvent affiché sur un écran qui n'a pas le focus
    // (second moniteur). Sans cela, le compteur d'incidents non pris en charge
    // se figerait exactement dans la situation où on le regarde de loin.
    refetchIntervalInBackground: !!options?.refetchInterval,
  });

export const useIncidentsOuvertsQuery = () =>
  useQuery({
    queryKey: standardKeys.ouverts(),
    queryFn: () => standardAPI.compterOuverts(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // rafraîchit le badge périodiquement
    refetchOnWindowFocus: true,
  });

/**
 * État du terrain (module Trafic) lu par la console : livreurs en course,
 * livreurs réellement disponibles (= dans la file du jour), et fiche courte du
 * livreur qui a signalé un incident. Jamais en erreur (repli sur un état vide).
 */
export const useTraficLivreursQuery = (refetchInterval: number | false = STANDARD_REFRESH_MS) =>
  useQuery({
    // NOTE (17/08) : cet écran et le module Trafic lisent le MÊME endpoint
    // (/api/erp/livreur/statut/trafic) sous DEUX clés de cache distinctes. La console
    // entretient donc un second cache, que le patch socket de `use-realtime-trafic`
    // (setQueryData sur traficKeyQuery) n'atteint jamais : elle reste sur l'état du
    // dernier tick au lieu d'être mise à jour en direct.
    //
    // Le partage de clé a été tenté puis abandonné : les deux features déclarent des
    // types différents pour la même charge utile (`statut`, `course` et d'autres sont
    // optionnels côté Trafic, requis ici). Les réconcilier est un chantier à part.
    queryKey: standardKeys.traficLivreurs(),
    queryFn: () => standardAPI.resumeTraficLivreurs(),
    staleTime: STANDARD_REFRESH_MS,
    refetchInterval,
    refetchOnWindowFocus: true,
  });

export const useChangerStatutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto, userId }: { id: string; dto: IChangerStatutIncident; userId: string }) =>
      standardAPI.changerStatut(id, dto, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(standardKeys.incident(data.id), data);
      queryClient.invalidateQueries({ queryKey: [...standardKeys.all, 'incidents'] });
      queryClient.invalidateQueries({ queryKey: standardKeys.ouverts() });
      toast.success('Statut de l\'incident mis à jour');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de modifier le statut', { description });
    },
  });
};

// ─── Administration des motifs ────────────────────────────────────────────────

export const useMotifsQuery = () =>
  useQuery({
    queryKey: standardKeys.motifs(),
    queryFn: () => standardAPI.listerMotifs(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreerMotifMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ICreerMotifIncident) => standardAPI.creerMotif(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardKeys.motifs() });
      toast.success('Motif créé');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de créer le motif', { description });
    },
  });
};

export const useModifierMotifMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, dto }: { code: string; dto: IModifierMotifIncident }) => standardAPI.modifierMotif(code, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardKeys.motifs() });
      toast.success('Motif mis à jour');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de modifier le motif', { description });
    },
  });
};

// ─── Appel audio in-app (LUNION Meet) ─────────────────────────────────────────

/** Historique paginé des appels (journal STANDARD). `refetchInterval` optionnel
 * pour faire remonter les appels EN COURS (colonne « Écouter »). */
export const useAppelsQuery = (
  page = 0,
  size = 20,
  refetchInterval?: number,
  userId?: string,
  // `enabled` par défaut à true : les écrans qui affichent le journal en permanence
  // ne changent pas. Il existe pour les panneaux qui montent ce hook sans être
  // ouverts, où la requête partait quand même.
  enabled = true,
) =>
  useQuery({
    queryKey: standardKeys.appels(page, userId, size),
    queryFn: () => standardAPI.listerAppels({ page, size, userId }),
    enabled,
    staleTime: refetchInterval ?? 30 * 1000,
    placeholderData: keepPreviousData,
    refetchInterval: refetchInterval ?? false,
  });

/**
 * Repli de signalisation : poll des appels entrants (SONNE) vers STANDARD.
 * Garantit que la console « sonne » même si l'agent connecté n'est pas un
 * notifier socket. `enabled` permet de couper le poll pendant un appel actif.
 *
 * La cadence dépend de ce que porte le socket.
 *
 * Le serveur laisse un appel sonner {@code TIMEOUT_SONNERIE_SECONDES = 60} s avant de
 * le passer en MANQUE (AppelService). Tant que le socket est connecté il pousse déjà
 * les six évènements APPEL_*, et le poll n'est qu'un filet : 15 s laissent quatre
 * chances de rattraper une sonnerie dans sa fenêtre d'une minute. Socket coupé, le
 * filet redevient la seule signalisation et reprend une cadence serrée.
 *
 * Mesuré avant : 4 s en permanence, y compris onglet caché, soit 900 requêtes par
 * heure et par onglet, sondage monté dans le layout donc actif sur TOUTES les pages.
 * C'était de loin le plus coûteux de l'ERP.
 */
export const APPELS_ENTRANTS_MS_SOCKET_OK = 15 * 1000;
export const APPELS_ENTRANTS_MS_SOCKET_COUPE = 3 * 1000;

export const useAppelsEntrantsQuery = (
  enabled = true,
  userId?: string,
  intervalMs: number = APPELS_ENTRANTS_MS_SOCKET_COUPE,
) =>
  useQuery({
    queryKey: standardKeys.appelsEntrants(),
    queryFn: () => standardAPI.listerAppelsEntrants(userId),
    enabled,
    refetchInterval: enabled ? intervalMs : false,
    // Continue à poller même quand l'onglet n'est PAS au premier plan : sinon la
    // console ne « voit » pas l'appel entrant tant que l'agent n'a pas le focus.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

/** Configuration du groupe de réponse : rôles qui sonnent sur un appel livreur → STANDARD. */
export const useAppelConfigQuery = (enabled = true) =>
  useQuery({
    queryKey: standardKeys.appelConfig(),
    queryFn: () => standardAPI.getAppelConfig(),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useModifierAppelConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: IAppelConfig) => standardAPI.modifierAppelConfig(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(standardKeys.appelConfig(), data);
      toast.success('Répondants mis à jour');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de mettre à jour les répondants', { description });
    },
  });
};

/** Supervision : appels EN COURS qu'un superviseur peut rejoindre pour écouter. */
export const useAppelsEnCoursQuery = (enabled = true) =>
  useQuery({
    queryKey: standardKeys.appelsEnCours(),
    queryFn: () => standardAPI.listerAppelsEnCours(),
    enabled,
    refetchInterval: enabled ? 5000 : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

export const useSuperviserAppelMutation = () =>
  useMutation({
    mutationFn: ({ id, superviseurId, superviseurNom }: { id: string; superviseurId: string; superviseurNom: string }) =>
      standardAPI.superviserAppel(id, { superviseurId, superviseurNom }),
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Impossible de rejoindre l'appel", { description });
    },
  });

/** STANDARD → livreur : initie l'appel (renvoie la session à rejoindre). */
export const useInitierAppelMutation = () =>
  useMutation({
    mutationFn: (dto: IInitierAppel) => standardAPI.initierAppel(dto),
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Impossible de lancer l'appel", { description });
    },
  });

/** Un agent STANDARD décroche un appel entrant. */
export const useAccepterAppelMutation = () =>
  useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IAccepterAppel }) => standardAPI.accepterAppel(id, dto),
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Impossible de rejoindre l'appel", { description });
    },
  });

/** Rejeter / raccrocher / annuler un appel (best-effort). */
export const useRejeterAppelMutation = () =>
  useMutation({ mutationFn: (id: string) => standardAPI.rejeterAppel(id) });

export const useRaccrocherAppelMutation = () =>
  useMutation({ mutationFn: (id: string) => standardAPI.raccrocherAppel(id) });

export const useAnnulerAppelMutation = () =>
  useMutation({ mutationFn: (id: string) => standardAPI.annulerAppel(id) });
