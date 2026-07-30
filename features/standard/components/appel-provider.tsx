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
  useRejeterAppelMutation,
  useSuperviserAppelMutation,
} from '../queries/standard.query';
import { AppelEntrantModal } from './appel-entrant-modal';
import { AppelWidget } from './appel-widget';
import { PersonnelCallPanel } from './personnel-call-panel';

interface SessionActive {
  session: IAppelSession;
  interlocuteur: string;
  moiNom: string;
  /** Écoute seule (supervision) : ne publie pas le micro, ne raccroche pas l'appel. */
  ecouteSeule?: boolean;
  /** Appel SORTANT : joue la tonalité de retour d'appel tant que ça sonne en face. */
  sortant?: boolean;
}

interface AppelContextValue {
  /** STANDARD → livreur : lance un appel audio in-app. */
  appelerLivreur: (livreurId: string, livreurNom: string, incidentId?: string) => void;
  /** Appel audio in-app entre membres du personnel Turbo (pair-à-pair). */
  appelerPersonnel: (userId: string, nom: string) => void;
  /** Supervision : rejoint un appel en cours pour l'écouter (écoute seule). */
  superviser: (appelId: string, titre?: string) => void;
  /** L'utilisateur courant peut-il superviser (écouter) un appel en cours ? */
  estSuperviseur: boolean;
  /** Les appels entre personnel sont-ils activés dans la config ? */
  appelsPersonnelActifs: boolean;
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
  const estSuperviseur = !!roleKey && (config?.rolesSuperviseurs ?? []).includes(roleKey);

  const appelsPersonnelActifs = !!config?.appelsPersonnelActifs;

  const queryClient = useQueryClient();
  const initier = useInitierAppelMutation();
  const accepter = useAccepterAppelMutation();
  const superviserMut = useSuperviserAppelMutation();
  const rejeter = useRejeterAppelMutation();

  const [active, setActive] = useState<SessionActive | null>(null);
  // Appel PAIR entrant détecté par SOCKET (le poll ne couvre que les appels vers
  // STANDARD). {appelId, appelantNom} tant qu'il sonne chez moi.
  const [pairEntrant, setPairEntrant] = useState<{ appelId: string; appelantNom: string } | null>(null);
  // Ref vers l'appel actif pour le lire dans le handler socket (closure figée).
  const activeRef = useRef<SessionActive | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Refus LOCAL (groupe d'appel) : « Refuser » masque la modale POUR CET AGENT
  // seulement — l'appel continue de sonner chez les autres répondants jusqu'au
  // décroché ou au timeout serveur (~1 min → MANQUE). Aucun rejet côté serveur.
  const [ignores, setIgnores] = useState<ReadonlySet<string>>(new Set());

  // Repli de signalisation : poll des appels entrants SONNE. Depuis V108 il
  // couvre STANDARD ET les appels PERSONNEL qui me ciblent — le socket seul
  // perdait l'appel pair-à-pair si l'onglet était en rechargement ou le socket
  // déconnecté (« quand il m'a appelé je n'ai pas été notifié »). Le poll est
  // donc actif pour TOUT agent connecté, pas seulement les répondants ; coupé
  // seulement pendant un appel actif.
  const { data: entrants } = useAppelsEntrantsQuery(!!agentId && !active, agentId);

  // Filet PERSONNEL : un appel pair qui me cible, vu par le poll alors que le
  // socket ne l'a pas signalé → on le fait sonner comme s'il venait du socket.
  useEffect(() => {
    if (active || pairEntrant) return;
    const pair = (entrants ?? []).find(
      (e) => e.contexte === 'PAIR_VERS_PAIR' && !ignores.has(e.appelId),
    );
    if (pair) {
      setPairEntrant({ appelId: pair.appelId, appelantNom: pair.appelantNom || 'Personnel Turbo' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrants, active, pairEntrant]);

  // La console affiche le premier appel de GROUPE (STANDARD) qui « sonne »
  // encore et non ignoré ici — réservé aux répondants configurés.
  // L'expiration ~1 min d'un appel sans réponse est décidée CÔTÉ SERVEUR (SONNE
  // > 60 s → MANQUE, qui le retire du poll). PAS de filtre d'âge client (il
  // coupait la modale au retour de focus alors que l'appel sonnait toujours).
  const premier =
    (estRepondant &&
      !active &&
      (entrants ?? []).find((e) => e.contexte !== 'PAIR_VERS_PAIR' && !ignores.has(e.appelId))) ||
    null;
  const entrant = premier
    ? {
        appelId: premier.appelId,
        titre: 'Appel entrant',
        appelantNom: premier.appelantNom || 'Appelant inconnu',
        sousTitre:
          premier.contexte === 'LIVREUR_VERS_STANDARD' ? 'Livreur · appel in-app' : 'Appel in-app',
        message: `${premier.appelantNom} vous appelle`,
      }
    : null;

  // Alerte navigateur (OS) quand un appel arrive alors que l'onglet n'est pas
  // visible : la sonnerie Web Audio est étouffée en arrière-plan, la notif prend le relais.
  const dernierAppelNotifie = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  }, []);
  // Couvre les DEUX types d'appels : groupe STANDARD et pair-à-pair PERSONNEL.
  const sonnerie = entrant
    ? { appelId: entrant.appelId, message: entrant.message }
    : pairEntrant
      ? { appelId: pairEntrant.appelId, message: `${pairEntrant.appelantNom} vous appelle` }
      : null;
  useEffect(() => {
    if (!sonnerie) {
      dernierAppelNotifie.current = null;
      return;
    }
    if (dernierAppelNotifie.current === sonnerie.appelId) return;
    dernierAppelNotifie.current = sonnerie.appelId;
    if (
      typeof document !== 'undefined' &&
      document.hidden &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notif = new Notification('Appel entrant', {
          body: sonnerie.message,
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
  }, [sonnerie?.appelId]);

  const appelerLivreur = useCallback(
    (livreurId: string, livreurNom: string, incidentId?: string) => {
      // Anti double-déclenchement : déjà en appel ou initiation déjà en vol.
      if (!agentId || active || initier.isPending) return;
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
            setActive({
              session: s,
              interlocuteur: s.appeleNom || livreurNom,
              moiNom: agentNom,
              sortant: true,
            }),
        },
      );
    },
    [agentId, agentNom, active, initier],
  );

  const appelerPersonnel = useCallback(
    (userId: string, nom: string) => {
      if (!agentId || active || initier.isPending) return;
      initier.mutate(
        {
          appelantId: agentId,
          appelantType: 'PERSONNEL',
          appeleId: userId,
          appeleType: 'PERSONNEL',
          contexte: 'PAIR_VERS_PAIR',
          // Le backend ne résout pas les noms d'utilisateurs ERP par id → on les fournit.
          appelantNom: agentNom,
          appeleNom: nom,
        },
        {
          onSuccess: (s) =>
            setActive({
              session: s,
              interlocuteur: s.appeleNom || nom,
              moiNom: agentNom,
              sortant: true,
            }),
        },
      );
    },
    [agentId, agentNom, active, initier],
  );

  const superviser = useCallback(
    (appelId: string, titre?: string) => {
      if (!agentId || active || superviserMut.isPending) return;
      superviserMut.mutate(
        { id: appelId, superviseurId: agentId, superviseurNom: agentNom },
        {
          onSuccess: (s) =>
            setActive({
              session: s,
              interlocuteur: titre || `${s.appelantNom} ↔ ${s.appeleNom}`,
              moiNom: agentNom,
              ecouteSeule: true,
            }),
        },
      );
    },
    [agentId, agentNom, active, superviserMut],
  );

  // Socket : accélère le repli (refetch immédiat des entrants pour les notifiers)
  // et coupe l'appel actif quand l'autre partie raccroche/annule.
  useEffect(() => {
    if (!agentId) return;
    const channel = `/notification/erp/${agentId}`;
    const onNotif = (raw: unknown) => {
      let d: { type?: string; lien?: string | null; message?: string | null } | null = null;
      try {
        d = typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof d);
      } catch {
        return;
      }
      const type = String(d?.type ?? '');
      const appelId = d?.lien ?? undefined;

      if (type === 'APPEL_ENTRANT_PAIR') {
        // Appel PAIR entrant ciblé sur MOI (pas de poll pour ce cas) : on fait
        // sonner directement depuis le socket. Nom appelant = message « X vous appelle ».
        if (appelId && !activeRef.current) {
          const nom = String(d?.message ?? '').replace(/\s*vous appelle\.?$/i, '').trim() || 'Personnel Turbo';
          setPairEntrant({ appelId, appelantNom: nom });
        }
      } else if (type === 'APPEL_ENTRANT_LIVREUR' || type === 'APPEL_ACCEPTE') {
        // Entrant : fait sonner plus vite. Accepté (par un AUTRE répondant) :
        // coupe la sonnerie ici sur-le-champ (l'appel sort du poll des SONNE).
        queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() });
      } else if (type === 'APPEL_REJETE') {
        // L'appelé a refusé : on ferme le widget côté appelant + raison.
        if (appelId && activeRef.current?.session.appelId === appelId) {
          toast.info('Appel refusé', {
            description: `${activeRef.current.interlocuteur} a refusé l'appel.`,
          });
        }
        if (appelId) setActive((a) => (a?.session.appelId === appelId ? null : a));
        setPairEntrant((p) => (p && p.appelId === appelId ? null : p));
        queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() });
      } else if (type === 'APPEL_TERMINE' || type === 'APPEL_ANNULE' || type === 'APPEL_MANQUE') {
        if (appelId) setActive((a) => (a?.session.appelId === appelId ? null : a));
        // L'appelant a annulé / timeout : on retire la sonnerie PAIR entrante.
        setPairEntrant((p) => (p && p.appelId === appelId ? null : p));
        queryClient.invalidateQueries({ queryKey: standardKeys.appelsEntrants() });
      }
    };
    socket.on(channel, onNotif);
    return () => {
      socket.off(channel, onNotif);
    };
  }, [agentId, queryClient]);

  const accepterEntrant = () => {
    // Anti double-clic : un seul décroché, même si l'opérateur clique plusieurs fois.
    if (!entrant || !agentId || accepter.isPending) return;
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

  // ── Appel PAIR entrant (ciblé sur moi) : décroché / refus DIRECTS (pas de groupe) ──
  const accepterPair = () => {
    if (!pairEntrant || !agentId || accepter.isPending) return;
    accepter.mutate(
      { id: pairEntrant.appelId, dto: { appeleId: agentId, appeleNom: agentNom } },
      {
        onSuccess: (s) => {
          setPairEntrant(null);
          setActive({ session: s, interlocuteur: pairEntrant.appelantNom || s.appelantNom, moiNom: agentNom });
        },
      },
    );
  };
  const refuserPair = () => {
    if (!pairEntrant) return;
    const id = pairEntrant.appelId;
    // Appel direct : le refus REJETTE réellement (l'appelant est prévenu).
    // On l'ignore AUSSI localement : le poll pourrait le re-signaler pendant
    // la fenêtre où la mutation n'a pas encore atteint le serveur.
    setIgnores((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    rejeter.mutate(id);
    setPairEntrant(null);
  };

  return (
    <AppelContext.Provider
      value={{
        appelerLivreur,
        appelerPersonnel,
        superviser,
        estSuperviseur,
        appelsPersonnelActifs,
        // « Occupé » inclut la fenêtre de LANCEMENT (mutation en vol) : sans ça, les
        // boutons « Appeler » restaient cliquables tant que la session n'existait pas.
        enAppel: !!active || initier.isPending || accepter.isPending || superviserMut.isPending,
      }}
    >
      {children}
      {entrant && !active && (
        <AppelEntrantModal
          titre={entrant.titre}
          appelantNom={entrant.appelantNom}
          sousTitre={entrant.sousTitre}
          onAccepter={accepterEntrant}
          onRefuser={refuserEntrant}
          enCours={accepter.isPending}
        />
      )}
      {/* Appel PAIR entrant (priorité au poll STANDARD s'il y en a un). */}
      {pairEntrant && !entrant && !active && (
        <AppelEntrantModal
          titre="Appel entrant"
          appelantNom={pairEntrant.appelantNom}
          sousTitre="Personnel Turbo · appel in-app"
          onAccepter={accepterPair}
          onRefuser={refuserPair}
          enCours={accepter.isPending}
        />
      )}
      {active && (
        <AppelWidget
          session={active.session}
          moiNom={active.moiNom}
          interlocuteur={active.interlocuteur}
          ecouteSeule={active.ecouteSeule}
          sortant={active.sortant}
          partageEcranAutorise={!!config?.partageEcranActif}
          onClose={() => setActive(null)}
        />
      )}
      {/* Bouton + panneau d'appel du personnel (gaté sur la config, non affiché sinon). */}
      <PersonnelCallPanel />
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
