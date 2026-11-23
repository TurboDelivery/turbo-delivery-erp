'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  accorderSurplusAction,
  etatRelancePreuvesAction,
  listerPreuvesAction,
  rejeterPreuveAction,
  relancerPreuvesAction,
  validerPreuveAction,
  affecterSiteAction,
  annulerSurplusAction,
  etatSoumissionSurplusAction,
  listerSurplusAction,
  modifierSurplusAction,
  bandeauCarburantAction,
  dupliquerSurSemaineSuivanteAction,
  etatCarburantAction,
  listerProgrammesSemaineAction,
  listerAutosuffisanceAction,
  listerIndependantsAction,
  creerProgrammeAction,
  modifierProgrammeAction,
  planifierProgrammeAction,
  publierProgrammeAction,
  envoyerProgrammeAction,
  supprimerProgrammeAction,
  dupliquerSemaineAction,
  renvoyerWhatsAppAction,
  historiqueProgrammeAction,
} from '@/features/turboys/actions/programme.actions';
import { engagerCarburant, soumettreSurplus } from '@/features/turboys/apis/carburant-engagement.api';
import {
  ICreerProgrammePayload,
  IDupliquerSemainePayload,
  IAccorderSurplusPayload,
  IValiderPreuvePayload,
  IAffecterSitePayload,
  IEngagerCarburantPayload,
  IModifierProgrammePayload,
} from '@/features/turboys/types/programme.types';
import { phraseWhatsAppApresEnvoi } from '@/features/turboys/utils/whatsapp-statut.utils';

export const programmeKeys = {
  all: ['programme'] as const,
  semaine: (annee: number, semaine: number) => [...programmeKeys.all, 'semaine', annee, semaine] as const,
  autosuffisance: (annee: number, semaine: number) => [...programmeKeys.all, 'autosuffisance', annee, semaine] as const,
  independants: (annee: number, semaine: number) => [...programmeKeys.all, 'independants', annee, semaine] as const,
  carburant: (annee: number, semaine: number) => [...programmeKeys.all, 'carburant', annee, semaine] as const,
  bandeau: (annee: number, semaine: number) => [...programmeKeys.all, 'bandeau', annee, semaine] as const,
  surplus: (programmeId: string) => [...programmeKeys.all, 'surplus', programmeId] as const,
  preuves: (programmeId: string) => [...programmeKeys.all, 'preuves', programmeId] as const,
  relancePreuves: (annee: number, semaine: number) =>
    [...programmeKeys.all, 'relance-preuves', annee, semaine] as const,
  soumissionSurplus: (annee: number, semaine: number) =>
    [...programmeKeys.all, 'soumission-surplus', annee, semaine] as const,
  historique: (id: string) => [...programmeKeys.all, 'historique', id] as const,
};

/** L'histoire d'un programme, lue à l'ouverture de sa fenêtre. */
export const useHistoriqueProgrammeQuery = (id: string | null | undefined) =>
  useQuery({
    queryKey: programmeKeys.historique(id ?? ''),
    queryFn: () => historiqueProgrammeAction(id!),
    enabled: !!id,
    staleTime: 10 * 1000,
  });

/**
 * Le bandeau carburant du haut de page (§8.2).
 *
 * Même fraîcheur que l'état d'engagement : ces deux chiffres se lisent côte à côte, et
 * l'un vieillissant plus vite que l'autre donnerait un écart qui n'existe pas.
 */
export const useBandeauCarburantQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.bandeau(annee, semaine),
    queryFn: () => bandeauCarburantAction(annee, semaine),
    enabled: !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

export const useEtatCarburantQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.carburant(annee, semaine),
    queryFn: () => etatCarburantAction(annee, semaine),
    enabled: !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

export const useProgrammesSemaineQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.semaine(annee, semaine),
    queryFn: () => listerProgrammesSemaineAction(annee, semaine),
    enabled: !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

export const useProgrammesIndependantsQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.independants(annee, semaine),
    queryFn: () => listerIndependantsAction(annee, semaine),
    enabled: !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

export const useAutosuffisanceSemaineQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.autosuffisance(annee, semaine),
    queryFn: () => listerAutosuffisanceAction(annee, semaine),
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

// ── Preuves de versement Wave (§9) ──────────────────────────────────────────

/** Les preuves d'un programme, rejetées comprises : la fenêtre les montre toutes. */
export const usePreuvesQuery = (programmeId: string | null | undefined) =>
  useQuery({
    queryKey: programmeKeys.preuves(programmeId ?? ''),
    queryFn: () => listerPreuvesAction(programmeId!),
    enabled: !!programmeId,
    staleTime: 10 * 1000,
  });

export const useEtatRelancePreuvesQuery = (annee: number, semaine: number, actif = true) =>
  useQuery({
    queryKey: programmeKeys.relancePreuves(annee, semaine),
    queryFn: () => etatRelancePreuvesAction(annee, semaine),
    enabled: actif && !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

export const useValiderPreuveMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, preuveId }: { id: string; payload: IValiderPreuvePayload; preuveId: string }) => {
      const r = await validerPreuveAction(id, preuveId, payload);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la validation');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Preuve validée.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const useRejeterPreuveMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motif, preuveId }: { id: string; motif: string; preuveId: string }) => {
      const r = await rejeterPreuveAction(id, preuveId, motif);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la demande');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Nouvelle capture demandée. Le livreur est prévenu, avec le motif.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/** Relancer les preuves manquantes (RG-W07, CA-56). */
export const useRelancerPreuvesMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ annee, programmeIds, semaine }: { annee: number; programmeIds?: string[]; semaine: number }) => {
      const r = await relancerPreuvesAction(annee, semaine, programmeIds);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la relance');
      return r.data!;
    },
    onSuccess: async (data, variables) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      const nb = variables.programmeIds?.length ?? data.livreurs.length;
      toast.success(`${nb} livreur${nb > 1 ? 's' : ''} relancé${nb > 1 ? 's' : ''} par notification.`);
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

// ── Surplus de carburant (§7) ───────────────────────────────────────────────

/** Les surplus d'un programme, annulés compris : l'écran les montre barrés (RG-C07). */
export const useSurplusQuery = (programmeId: string | null | undefined) =>
  useQuery({
    queryKey: programmeKeys.surplus(programmeId ?? ''),
    queryFn: () => listerSurplusAction(programmeId!),
    enabled: !!programmeId,
    staleTime: 10 * 1000,
  });

export const useEtatSoumissionSurplusQuery = (annee: number, semaine: number) =>
  useQuery({
    queryKey: programmeKeys.soumissionSurplus(annee, semaine),
    queryFn: () => etatSoumissionSurplusAction(annee, semaine),
    enabled: !!annee && !!semaine,
    staleTime: 30 * 1000,
  });

export const useAccorderSurplusMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: IAccorderSurplusPayload }) => {
      const r = await accorderSurplusAction(id, payload);
      if (!r.success) throw new Error(r.error || "Erreur lors de l'ajout du surplus");
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      // Le message dit ce qui N'A PAS changé : c'est la question que se pose
      // l'opérateur juste après avoir cliqué.
      toast.success('Surplus accordé. La dotation prévue ne change pas ; le livreur est prévenu.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const useModifierSurplusMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload, surplusId }: { id: string; payload: IAccorderSurplusPayload; surplusId: string }) => {
      const r = await modifierSurplusAction(id, surplusId, payload);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la modification du surplus');
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Surplus modifié.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const useAnnulerSurplusMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motif, surplusId }: { id: string; motif: string; surplusId: string }) => {
      const r = await annulerSurplusAction(id, surplusId, motif);
      if (!r.success) throw new Error(r.error || "Erreur lors de l'annulation du surplus");
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Surplus annulé. Il reste visible, barré, avec son motif.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/** Soumettre les surplus de la semaine au décaissement (décision du 23/11). */
export const useSoumettreSurplusMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (donnees: FormData) => soumettreSurplus(donnees, (session?.user as { id?: string } | undefined)?.id),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success(
        `${data.nbDejaSoumis} surplus soumis au décaissement, dans une charge distincte de la dotation.`,
      );
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/**
 * Affecter à un autre site aujourd'hui (§3.3, RG-S08).
 *
 * <p>Le succès le dit explicitement : le programme n'est PAS repassé en « à publier ».
 * C'est la question que se pose l'opérateur juste après avoir cliqué, et ne pas y
 * répondre le pousse à aller vérifier.</p>
 */
export const useAffecterSiteMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: IAffecterSitePayload }) => {
      const r = await affecterSiteAction(id, payload);
      if (!r.success) throw new Error(r.error || "Erreur lors de l'affectation du site");
      return r.data!;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Site affecté. Le livreur est prévenu ; le programme reste publié.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/** Dupliquer CE programme sur la semaine suivante (§6.2). */
export const useDupliquerSurSemaineSuivanteMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await dupliquerSurSemaineSuivanteAction(id);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la duplication');
      return r.data!;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success(`Programme dupliqué en brouillon sur la semaine ${data.semaine}.`);
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
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      // Ce que le WhatsApp a donné se dit tout de suite : un envoi qui n'est pas parti
      // ne doit pas se lire comme une publication réussie.
      const w = phraseWhatsAppApresEnvoi(data);
      (w.ok ? toast.success : toast.warning)(`Programme publié. ${w.texte}`);
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

export const useSupprimerProgrammeMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await supprimerProgrammeAction(id);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la suppression');
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Programme supprimé.');
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/**
 * Engager le carburant publié de la semaine comme charge variable.
 *
 * <p>L'auteur est le compte connecté, sous les deux formes que le circuit finance attend :
 * son nom dans `creerPar`, son identifiant dans `X-User-Id`, comme la création d'une
 * dépense. Le message d'erreur du serveur est rendu tel quel : un 409 dit précisément
 * pourquoi la charge ne bouge plus et ce qu'il reste à faire.</p>
 */
export const useEngagerCarburantMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const nom = session?.user?.name ?? '';
  return useMutation({
    mutationFn: async (p: IEngagerCarburantPayload) => {
      const fd = new FormData();
      fd.append('annee', String(p.annee));
      fd.append('semaine', String(p.semaine));
      fd.append('categorieId', p.categorieId);
      fd.append('creerPar', nom || 'Opérations');
      fd.append('justificatif', p.justificatif, `programmes_${p.annee}_S${p.semaine}.pdf`);
      return engagerCarburant(fd, userId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      toast.success('Carburant engagé : la dépense attend le visa du DGA.');
      onDone?.();
    },
    onError: (error: unknown) => {
      const reponse = (error as { response?: { data?: { message?: string } | string } })?.response?.data;
      const message = typeof reponse === 'string' ? reponse : reponse?.message;
      toast.error(message || messageErreur(error));
    },
  });
};

export const useEnvoyerProgrammeMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await envoyerProgrammeAction(id);
      if (!r.success) throw new Error(r.error || "Erreur lors de l'envoi du programme");
      return r.data!;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      const w = phraseWhatsAppApresEnvoi(data);
      (w.ok ? toast.success : toast.warning)(`Programme envoyé. ${w.texte}`);
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/** Renvoyer le programme par WhatsApp seulement, sans le republier. */
export const useRenvoyerWhatsAppMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await renvoyerWhatsAppAction(id);
      if (!r.success) throw new Error(r.error || "Erreur lors de l'envoi WhatsApp");
      return r.data!;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      const w = phraseWhatsAppApresEnvoi(data);
      (data.whatsappStatut === 'ENVOYE' ? toast.success : toast.warning)(
        data.whatsappStatut === 'ENVOYE' ? 'WhatsApp envoyé au livreur.' : w.texte,
      );
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};

/**
 * Dupliquer une semaine entière vers la semaine affichée, en brouillon. Le serveur refuse
 * une cible qui porte déjà un programme, ou une semaine passée : son message est rendu
 * tel quel, il dit quoi faire.
 */
export const useDupliquerSemaineMutation = (onDone?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IDupliquerSemainePayload) => {
      const r = await dupliquerSemaineAction(payload);
      if (!r.success) throw new Error(r.error || 'Erreur lors de la duplication');
      return r.data!;
    },
    onSuccess: async (d) => {
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      const restes = [
        d.ignores > 0 ? `${d.ignores} sans livreur` : '',
        d.dejaDeclares > 0
          ? `${d.dejaDeclares} livreur${d.dejaDeclares > 1 ? 's' : ''} avaient déjà déclaré cette semaine, leur déclaration est intacte`
          : '',
      ].filter(Boolean);
      toast.success(
        `${d.crees} programme${d.crees > 1 ? 's' : ''} dupliqué${d.crees > 1 ? 's' : ''} depuis la semaine ${d.depuisSemaine}/${d.depuisAnnee}, en brouillon.${restes.length > 0 ? ` ${restes.join(', ')}.` : ''}`,
      );
      onDone?.();
    },
    onError: (error) => toast.error(messageErreur(error)),
  });
};
