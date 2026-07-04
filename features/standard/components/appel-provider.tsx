'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { socket } from '@/socket';

import { IAppelSession } from '../types/standard.types';
import {
  useAccepterAppelMutation,
  useInitierAppelMutation,
  useRejeterAppelMutation,
} from '../queries/standard.query';
import { AppelEntrantModal } from './appel-entrant-modal';
import { AppelWidget } from './appel-widget';

interface SessionActive {
  session: IAppelSession;
  interlocuteur: string;
  moiNom: string;
}
interface AppelEntrant {
  appelId: string;
  titre: string;
  message: string;
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

  const initier = useInitierAppelMutation();
  const accepter = useAccepterAppelMutation();
  const rejeter = useRejeterAppelMutation();

  const [active, setActive] = useState<SessionActive | null>(null);
  const [entrant, setEntrant] = useState<AppelEntrant | null>(null);

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

  // Écoute des appels entrants + fins d'appel sur le canal de l'agent.
  useEffect(() => {
    if (!agentId) return;
    const channel = `/notification/erp/${agentId}`;
    const onNotif = (raw: unknown) => {
      let d: { type?: string; lien?: string | null; titre?: string; message?: string } | null = null;
      try {
        d = typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof d);
      } catch {
        return;
      }
      const type = String(d?.type ?? '');
      const appelId = d?.lien ?? undefined;
      if (!appelId) return;

      if (type === 'APPEL_ENTRANT_LIVREUR') {
        setEntrant((e) => e ?? { appelId, titre: d?.titre ?? 'Appel entrant', message: d?.message ?? '' });
      } else if (type === 'APPEL_TERMINE' || type === 'APPEL_ANNULE') {
        setEntrant((e) => (e?.appelId === appelId ? null : e));
        setActive((a) => (a?.session.appelId === appelId ? null : a));
      }
    };
    socket.on(channel, onNotif);
    return () => {
      socket.off(channel, onNotif);
    };
  }, [agentId]);

  const accepterEntrant = () => {
    if (!entrant || !agentId) return;
    accepter.mutate(
      { id: entrant.appelId, dto: { appeleId: agentId, appeleNom: agentNom } },
      {
        onSuccess: (s) => {
          setActive({ session: s, interlocuteur: s.appelantNom, moiNom: agentNom });
          setEntrant(null);
        },
        onError: () => setEntrant(null),
      },
    );
  };

  const refuserEntrant = () => {
    if (!entrant) return;
    rejeter.mutate(entrant.appelId);
    setEntrant(null);
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
