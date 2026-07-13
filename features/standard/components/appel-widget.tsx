'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLunionRoom } from '@lunionlab/meet-react';
import { Button } from '@heroui/react';
import { IconEar, IconMicrophone, IconMicrophoneOff, IconPhoneOff } from '@tabler/icons-react';

import { IAppelSession } from '../types/standard.types';
import { useRaccrocherAppelMutation } from '../queries/standard.query';

interface AppelWidgetProps {
  /** Session renvoyée par initier/accepter (token + url + roomSlug). */
  session: IAppelSession;
  /** Nom du participant local (ex. libellé STANDARD / nom de l'agent). */
  moiNom: string;
  /** Nom de l'interlocuteur à afficher. */
  interlocuteur: string;
  /** Fermeture du widget (fin d'appel). */
  onClose: () => void;
  /**
   * Mode SUPERVISION (écoute seule) : on rejoint sans publier le micro et
   * « Quitter » ne raccroche PAS l'appel (le superviseur n'est pas une partie).
   */
  ecouteSeule?: boolean;
}

/**
 * Widget d'appel AUDIO in-app (LUNION Meet) pour la console STANDARD.
 * Panneau flottant : audio-only (video: false), micro + raccrocher + minuteur.
 * En mode {@link ecouteSeule}, écoute la conversation sans publier ni raccrocher.
 */
export function AppelWidget({ session, moiNom, interlocuteur, onClose, ecouteSeule = false }: AppelWidgetProps) {
  const { status, error, participants, micEnabled, toggleMic, leave } = useLunionRoom({
    sfuUrl: session.url,
    room: session.roomSlug,
    name: moiNom,
    token: session.token,
    video: false,
    audio: !ecouteSeule,
  });
  const raccrocher = useRaccrocherAppelMutation();
  const [secondes, setSecondes] = useState(0);
  const rendered = useRef(false);

  // Minuteur : démarre quand l'interlocuteur a décroché (au moins 1 participant distant).
  const connecte = status === 'connected' && participants.length > 0;
  useEffect(() => {
    if (!connecte) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [connecte]);

  const terminer = () => {
    if (rendered.current) return;
    rendered.current = true;
    try {
      leave();
    } catch {
      /* best-effort */
    }
    // Un superviseur qui quitte ne raccroche PAS l'appel des autres.
    if (!ecouteSeule) raccrocher.mutate(session.appelId);
    onClose();
  };

  // Timeout ~1 min (appel normal seulement) : sonnerie sans réponse → raccroché.
  // En supervision, l'appel est déjà en cours → pas de timeout.
  useEffect(() => {
    if (connecte || ecouteSeule) return;
    const t = setTimeout(() => terminer(), 60_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connecte, ecouteSeule]);

  const minuteur = useMemo(() => {
    const m = Math.floor(secondes / 60).toString().padStart(2, '0');
    const s = (secondes % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondes]);

  const libelle =
    status === 'error'
      ? 'Connexion impossible'
      : connecte
        ? (ecouteSeule ? `Écoute · ${minuteur}` : minuteur)
        : status === 'connected'
          ? 'En attente…'
          : status === 'connecting'
            ? 'Connexion…'
            : ecouteSeule
              ? 'Connexion à l’écoute…'
              : 'Appel…';

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 rounded-2xl border border-default-200 bg-white p-5 shadow-2xl">
      {/* Audio des participants distants (caché ; on ne rend pas son propre flux → pas d'écho). */}
      {participants.map((p) => (
        <audio
          key={p.id}
          autoPlay
          ref={(el) => {
            if (el && p.stream) el.srcObject = p.stream;
          }}
        />
      ))}

      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {interlocuteur?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <p className="font-semibold text-default-800">{interlocuteur}</p>
        <p className={`text-sm ${status === 'error' ? 'text-danger' : 'text-default-500'}`}>{libelle}</p>
        {error && <p className="text-xs text-danger-400">{error.message}</p>}
      </div>

      {ecouteSeule && (
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-warning">
          <IconEar size={16} /> Écoute discrète — micro coupé
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-3">
        {!ecouteSeule && (
          <Button
            isIconOnly
            radius="full"
            variant={micEnabled ? 'flat' : 'solid'}
            color={micEnabled ? 'default' : 'warning'}
            onPress={() => toggleMic()}
            aria-label={micEnabled ? 'Couper le micro' : 'Activer le micro'}
          >
            {micEnabled ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
          </Button>
        )}
        <Button
          isIconOnly
          radius="full"
          color="danger"
          onPress={terminer}
          aria-label={ecouteSeule ? "Quitter l'écoute" : 'Raccrocher'}
        >
          <IconPhoneOff size={20} />
        </Button>
      </div>
    </div>
  );
}
