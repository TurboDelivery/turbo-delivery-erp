'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { socket } from '@/socket';
import { normalizeRole } from '@/lib/casl/ability';

import { IAppelSession } from '../types/standard.types';
import {
  standardKeys,
  useAccepterAppelMutation,
  useAppelConfigQuery,
  useAppelsEntrantsQuery,
  useInitierAppelMutation,
} from '../queries/standard.query';
import { AppelEntrantModal } from './appel-entrant-modal';
import { AppelWidget } from './appel-widget';

interface SessionActive {
  session: IAppelSession;
  interlocuteur: string;
  moiNom: string;
}

interface AppelContextValue {
  /** STANDARD → livreur : lance un appel audio in-app. */
  appelerLivreur: (livreurId: string, livreurNom: string, incidentId?: string) => void;
  enAppel: boolean;
}

const AppelContext = createContext<AppelContextValue | null>(null);

/**
 * Orchestre l'appel audio de la console STANDARD (les 2 sens) :
 * - sortant : {@link appelerLivreur} → initier → widget ;
 * - entrant : écoute le socket {@code APPEL_ENTRANT_LIVREUR} → modale → accepter → widget.
 * À monter UNE FOIS dans le layout protégé.
 */
export function AppelProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const agentId = session?.user?.id;
  const agentNom = session?.user?.name ?? 'STANDARD';

  // Groupe de réponse configurable : seuls les utilisateurs dont le RÔLE figure
  // dans la config (défaut STANDARD) sonnent sur un appel livreur → STANDARD.
  const roleKey = normalizeRole(
    (session?.user?.role as unknown as string | { libelle?: string } | null | undefined) ?? null,
  );
  const { data: config } = useAppelConfigQuery(!!roleKey);
  const estRepondant = !!roleKey && (config?.rolesRepondants ?? ['STANDARD']).includes(roleKey);

  const queryClient = useQueryClient();
  const initier = useInitierAppelMutation();
  const accepter = useAccepterAppelMutation();

  const [active, setActive] = useState<SessionActive | null>(null);
  // Ref vers l'appel actif pour le lire dans le handler socket (closure figée).
  const activeRef = useRef<SessionActive | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Refus LOCAL (groupe d'appel) : « Refuser » masque la modale POUR CET AGENT
  // seulement — l'appel continue de sonner chez les autres répondants jusqu'au
  // décroché ou au timeout serveur (~1 min → MANQUE). Aucun rejet côté serveur.
  const [ignores, setIgnores] = useState<ReadonlySet<string>>(new Set());

  // Repli de signalisation : poll des appels entrants SONNE vers STANDARD.
  // Fiable même hors socket. Coupé pendant un appel actif ou si non-répondant.
  const { data: entrants } = useAppelsEntrantsQuery(estRepondant && !active);
  // La console affiche le premier appel qui « sonne » encore et non ignoré ici.
  // L'expiration ~1 min d'un appel sans réponse est décidée CÔTÉ SERVEUR (SONNE
  // > 60 s → MANQUE, qui le retire du poll). PAS de filtre d'âge client (il
  // coupait la modale au retour de focus alors que l'appel sonnait toujours).
  const premier =
    (estRepondant && !active && (entrants ?? []).find((e) => !ignores.has(e.appelId))) || null;
  const entrant = premier
    ? { appelId: premier.appelId, titre: 'Appel entrant', message: `${premier.appelantNom} vous appelle` }
    : null;

  // Alerte navigateur (OS) quand un appel arrive alors que l'onglet n'est pas
  // visible : la sonnerie Web Audio est étouffée en arrière-plan, la notif prend le relais.
  const dernierAppelNotifie = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  }, []);
  useEffect(() => {
    if (!entrant) {
      dernierAppelNotifie.current = null;
      return;
    }
    if (dernierAppelNotifie.current === entrant.appelId) return;
    dernierAppelNotifie.current = entrant.appelId;
    if (
      typeof document !== 'undefined' &&
      document.hidden &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notif = new Notification('Appel entrant', {
          body: entrant.message,
          tag: 'appel-entrant',
          requireInteraction: true,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrant?.appelId]);

  const appelerLivreur = useCallback(
    (livreurId: string, livreurNom: string, incidentId?: string) => {
      if (!agentId || active) return;
      initier.mutate(
        {
          appelantId: agentId,
          appelantType: 'STANDARD',
          appeleId: livreurId,
          appeleType: 'LIVREUR',
          contexte: 'STANDARD_VERS_LIVREUR',
          incidentId: incidentId ?? null,
        },
        {
          onSuccess: (s) =>
            setActive({ session: s, interlocuteur: s.appeleNom || livreurNom, moiNom: agentNom }),
        },
      );
    },
    [agentId, agentNom, active, initier],
  );

  // Socket : accélère le repli (refetch immédiat des entrants pour les notifiers)
  // et coupe l'appel actif quand l'autre partie raccroche/annule.
  useEffect(() => {
    if (!agentId) return;
    const channel = `/notification/erp/${agentId}`;
    const onNotif = (raw: unknown) => {
      let d: { type?: string; lien?: string | null } | null = null;
      try {
        d = typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof d);
      } catch {
        return;
      }
      const type = String(d?.type ?? '');
      const appelId = d?.lien ?? undefined;

      if (type === 'APPEL_ENTRANT_LIVREUR' || type === 'APPEL_ACCEPTE') {
        // Entrant : fait sonner plus vite. Accepté (par un AUTRE répondant) :
        // coupe la sonnerie ici sur-le-champ (l'appel sort du poll des SONNE).
        queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() });
      } else if (type === 'APPEL_REJETE') {
        // L'appelé (livreur) a refusé : on ferme le widget côté appelant + raison.
        if (appelId && activeRef.current?.session.appelId === appelId) {
          toast.info('Appel refusé', {
            description: `${activeRef.current.interlocuteur} a refusé l'appel.`,
          });
        }
        if (appelId) setActive((a) => (a?.session.appelId === appelId ? null : a));
        queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() });
      } else if (type === 'APPEL_TERMINE' || type === 'APPEL_ANNULE' || type === 'APPEL_MANQUE') {
        if (appelId) setActive((a) => (a?.session.appelId === appelId ? null : a));
        queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() });
      }
    };
    socket.on(channel, onNotif);
    return () => {
      socket.off(channel, onNotif);
    };
  }, [agentId, queryClient]);

  const accepterEntrant = () => {
    if (!entrant || !agentId) return;
    accepter.mutate(
      { id: entrant.appelId, dto: { appeleId: agentId, appeleNom: agentNom } },
      {
        onSuccess: (s) => setActive({ session: s, interlocuteur: s.appelantNom, moiNom: agentNom }),
        onSettled: () =>
          queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() }),
      },
    );
  };

  const refuserEntrant = () => {
    if (!entrant) return;
    const id = entrant.appelId;
    // Refus LOCAL uniquement (groupe d'appel) : l'appel continue de sonner chez
    // les autres répondants ; ici on masque simplement la modale pour cet agent.
    setIgnores((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <AppelContext.Provider value={{ appelerLivreur, enAppel: !!active }}>
      {children}
      {entrant && !active && (
        <AppelEntrantModal
          titre={entrant.titre}
          message={entrant.message}
          onAccepter={accepterEntrant}
          onRefuser={refuserEntrant}
        />
      )}
      {active && (
        <AppelWidget
          session={active.session}
          moiNom={active.moiNom}
          interlocuteur={active.interlocuteur}
          onClose={() => setActive(null)}
        />
      )}
    </AppelContext.Provider>
  );
}

export function useAppel() {
  const ctx = useContext(AppelContext);
  if (!ctx) {
    throw new Error('useAppel doit être utilisé dans <AppelProvider>');
  }
  return ctx;
}
