'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoTrack } from '@lunionlab/meet-react';
import {
  IconChevronDown,
  IconChevronUp,
  IconEar,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconScreenShare,
  IconScreenShareOff,
} from '@tabler/icons-react';

// SDK officiel 0.5.0 (tarball vendorisé, commit 9c6bbc6) : partage d'écran natif
// (résilient à la reconnexion, option audio système) + reconnexion réseau auto.
import { useLunionRoom } from '@lunionlab/meet-react';

import { IAppelSession } from '../types/standard.types';
import { useRaccrocherAppelMutation } from '../queries/standard.query';
import { useRingtone } from '../hooks/use-ringtone';
import { formaterDuree, initialesDe } from '../utils/appel-ui.utils';

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
  /** Appel SORTANT : joue la tonalité de retour d'appel tant que ça sonne en face. */
  sortant?: boolean;
  /** Partage d'écran autorisé (config « partage d'écran » du module d'appel). */
  partageEcranAutorise?: boolean;
}

/**
 * Appel AUDIO in-app (LUNION Meet) — panneau flottant (desktop) / feuille basse
 * (mobile) au style messagerie moderne : dégradé sombre, avatar, minuteur,
 * micro + raccrocher, et réduction en pastille pour continuer à travailler.
 *
 * Sur un appel sortant, la tonalité de retour d'appel est jouée tant que
 * l'interlocuteur n'a pas décroché.
 */
export function AppelWidget({
  session,
  moiNom,
  interlocuteur,
  onClose,
  ecouteSeule = false,
  sortant = false,
  partageEcranAutorise = false,
}: AppelWidgetProps) {
  const {
    status,
    error,
    participants,
    micEnabled,
    isScreenSharing,
    toggleMic,
    shareScreen,
    stopScreenShare,
    leave,
  } = useLunionRoom({
    sfuUrl: session.url,
    room: session.roomSlug,
    name: moiNom,
    token: session.token,
    video: false,
    audio: !ecouteSeule,
    // Superviseur : récepteur pur — aucun getUserMedia, aucune permission micro.
    receiveOnly: ecouteSeule,
  });
  const raccrocher = useRaccrocherAppelMutation();
  const [secondes, setSecondes] = useState(0);
  const [reduit, setReduit] = useState(false);
  const [raccrochage, setRaccrochage] = useState(false);
  const dejaTermine = useRef(false);

  // Décroché effectif = au moins un participant distant dans la room.
  const connecte = status === 'connected' && participants.length > 0;

  // Tonalité de retour d'appel : appel sortant, tant que ça n'a pas décroché.
  useRingtone(sortant && !ecouteSeule && !connecte && status !== 'error', 'retour');

  // Minuteur : démarre au décroché.
  useEffect(() => {
    if (!connecte) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [connecte]);

  const terminer = () => {
    // Anti double-clic : une seule fin d'appel, quoi qu'il arrive.
    if (dejaTermine.current) return;
    dejaTermine.current = true;
    setRaccrochage(true);
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
  useEffect(() => {
    if (connecte || ecouteSeule) return;
    const t = setTimeout(() => terminer(), 60_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connecte, ecouteSeule]);

  const libelle =
    status === 'error'
      ? 'Connexion impossible'
      : connecte
        ? (ecouteSeule ? `Écoute · ${formaterDuree(secondes)}` : formaterDuree(secondes))
        : status === 'connecting'
          ? 'Connexion…'
          : ecouteSeule
            ? "Connexion à l'écoute…"
            : sortant
              ? 'Sonne…'
              : 'En attente…';

  const flux = (
    <>
      {/* Audio des participants distants (on ne rend pas son propre flux → pas d'écho). */}
      {participants.map((p) => (
        <audio
          key={p.id}
          autoPlay
          ref={(el) => {
            if (el && p.stream) el.srcObject = p.stream;
          }}
        />
      ))}
    </>
  );

  // ── Mode réduit : pastille compacte, l'opérateur continue à travailler ──
  if (reduit) {
    return (
      <div className="fixed bottom-4 right-4 z-150 sm:bottom-6 sm:right-6">
        {flux}
        <div className="flex items-center gap-3 rounded-full bg-slate-900/95 py-2 pl-2 pr-3 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-sm font-bold">
            {initialesDe(interlocuteur)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{interlocuteur}</p>
            <p className="text-[11px] tabular-nums text-emerald-300">{libelle}</p>
          </div>
          <button
            type="button"
            onClick={() => setReduit(false)}
            aria-label="Agrandir l'appel"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/10 transition hover:bg-surface/20"
          >
            <IconChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={terminer}
            disabled={raccrochage}
            aria-label={ecouteSeule ? "Quitter l'écoute" : 'Raccrocher'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 transition hover:bg-rose-500 disabled:opacity-50"
          >
            <IconPhoneOff size={16} />
          </button>
        </div>
      </div>
    );
  }

  const participantAvecEcran =
    participants.find((p) => p.stream.getVideoTracks().length > 0) ?? null;
  const ecran = participantAvecEcran
    ? { name: participantAvecEcran.name, stream: participantAvecEcran.stream }
    : null;

  // ── Mode plein : feuille basse (mobile) / carte flottante (desktop) ──
  // Un écran partagé en face élargit le panneau pour rester lisible.
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-150 sm:inset-x-auto sm:bottom-6 sm:right-6 ${
        ecran ? 'sm:w-[620px]' : 'sm:w-80'
      }`}
    >
      {flux}
      <div className="relative overflow-hidden bg-linear-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-2xl ring-1 ring-white/10 rounded-t-3xl sm:rounded-3xl">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Barre : réduire */}
        <div className="relative flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={() => setReduit(true)}
            aria-label="Réduire l'appel"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/10 text-white/80 transition hover:bg-surface/20"
          >
            <IconChevronDown size={16} />
          </button>
        </div>

        <div className="relative flex flex-col items-center gap-2 px-6 pb-2">
          <div className="relative flex h-20 w-20 items-center justify-center">
            {!connecte && status !== 'error' && (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 [animation-duration:2s]" />
            )}
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-xl font-bold shadow-lg ring-4 ring-white/10">
              {initialesDe(interlocuteur)}
            </span>
          </div>
          <p className="max-w-full truncate text-lg font-semibold">{interlocuteur}</p>
          <p
            className={`text-sm tabular-nums ${
              status === 'error' ? 'text-rose-300' : connecte ? 'text-emerald-300' : 'text-white/60'
            }`}
          >
            {libelle}
          </p>
          {error && <p className="text-center text-xs text-rose-300/80">{error.message}</p>}
          {ecouteSeule && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">
              <IconEar size={14} /> Écoute discrète — micro coupé
            </span>
          )}
        </div>

        {/* Écran partagé par l'interlocuteur */}
        {ecran && (
          <div className="relative mx-4 mt-3 overflow-hidden rounded-2xl bg-black ring-1 ring-white/15">
            <VideoTrack stream={ecran.stream} muted className="max-h-[45vh] w-full object-contain" />
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90">
              Écran de {ecran.name}
            </span>
          </div>
        )}

        {/* Contrôles */}
        <div className="relative mt-4 flex items-center justify-center gap-8 border-t border-separator/10 bg-black/20 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">
          {!ecouteSeule && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleMic()}
                aria-label={micEnabled ? 'Couper le micro' : 'Activer le micro'}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition active:scale-95 ${
                  micEnabled ? 'bg-surface/10 hover:bg-surface/20' : 'bg-amber-500 hover:bg-amber-400'
                }`}
              >
                {micEnabled ? <IconMicrophone size={22} /> : <IconMicrophoneOff size={22} />}
              </button>
              <span className="text-[11px] text-white/60">{micEnabled ? 'Micro' : 'Coupé'}</span>
            </div>
          )}
          {partageEcranAutorise && !ecouteSeule && connecte && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  // getDisplayMedia exige un geste utilisateur : l'appel reste
                  // dans le handler du clic (pas de setTimeout/async détaché).
                  if (isScreenSharing) stopScreenShare();
                  else void shareScreen();
                }}
                aria-label={isScreenSharing ? 'Arrêter le partage' : "Partager l'écran"}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition active:scale-95 ${
                  isScreenSharing ? 'bg-sky-500 hover:bg-sky-400' : 'bg-surface/10 hover:bg-surface/20'
                }`}
              >
                {isScreenSharing ? <IconScreenShareOff size={22} /> : <IconScreenShare size={22} />}
              </button>
              <span className="text-[11px] text-white/60">{isScreenSharing ? 'Partagé' : 'Écran'}</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={terminer}
              disabled={raccrochage}
              aria-label={ecouteSeule ? "Quitter l'écoute" : 'Raccrocher'}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 shadow-lg transition hover:bg-rose-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconPhoneOff size={22} />
            </button>
            <span className="text-[11px] text-white/60">
              {raccrochage ? '…' : ecouteSeule ? 'Quitter' : 'Raccrocher'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
