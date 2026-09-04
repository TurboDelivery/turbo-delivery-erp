'use client';

import { useEffect, useState } from 'react';
import { IconPhone, IconPhoneOff } from '@tabler/icons-react';

import { useRingtone } from '../hooks/use-ringtone';
import { initialesDe } from '../utils/appel-ui.utils';

interface AppelEntrantModalProps {
  titre: string;
  /** Nom de l'appelant (affiché en grand). */
  appelantNom: string;
  /** Ligne de contexte sous le nom (ex. « Livreur · incident #12 »). */
  sousTitre?: string;
  onAccepter: () => void;
  onRefuser: () => void;
  /** Décroché en cours : verrouille les deux boutons (anti double-clic). */
  enCours?: boolean;
}

/**
 * Appel AUDIO entrant — écran d'appel plein écran (mobile) / carte centrée
 * (desktop) façon messagerie moderne : fond dégradé, avatar à halos pulsés,
 * gros boutons ronds Refuser / Répondre.
 *
 * La sonnerie continue même si l'onglet n'est pas au premier plan
 * (cf. {@link useRingtone}).
 */
export function AppelEntrantModal({
  titre,
  appelantNom,
  sousTitre,
  onAccepter,
  onRefuser,
  enCours = false,
}: AppelEntrantModalProps) {
  useRingtone(true, 'entrant');

  // Compteur « ça sonne depuis … » — repère utile pour l'opérateur.
  const [secondes, setSecondes] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${titre} — ${appelantNom}`}
      className="fixed inset-0 z-200 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs sm:p-4"
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-linear-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-2xl sm:h-auto sm:max-w-sm sm:rounded-3xl sm:ring-1 sm:ring-white/10"
      >
        {/* Halo d'ambiance */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 sm:py-10">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-emerald-300/90">
            {titre || 'Appel entrant'}
          </p>

          {/* Avatar + halos pulsés */}
          <div className="relative flex h-32 w-32 items-center justify-center sm:h-28 sm:w-28">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 [animation-duration:2s]" />
            <span className="absolute inset-3 animate-ping rounded-full bg-emerald-400/20 [animation-duration:2s] [animation-delay:.4s]" />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-3xl font-bold text-white shadow-lg ring-4 ring-white/10 sm:h-20 sm:w-20 sm:text-2xl">
              {initialesDe(appelantNom)}
            </span>
          </div>

          <div className="text-center">
            <p className="text-2xl font-semibold leading-tight sm:text-xl">{appelantNom}</p>
            {sousTitre && <p className="mt-1 text-sm text-white/60">{sousTitre}</p>}
            <p className="mt-2 text-sm text-white/50">
              Sonne depuis {secondes}s
              <span className="ml-1 inline-flex gap-0.5 align-middle">
                <span className="h-1 w-1 animate-bounce rounded-full bg-surface/60 [animation-delay:0ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-surface/60 [animation-delay:150ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-surface/60 [animation-delay:300ms]" />
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex items-start justify-center gap-14 border-t border-white/10 bg-black/20 px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:gap-12 sm:py-6 sm:pb-6">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onRefuser}
              disabled={enCours}
              aria-label="Refuser l'appel"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition hover:bg-rose-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:w-14"
            >
              <IconPhoneOff size={26} />
            </button>
            <span className="text-xs text-white/60">Refuser</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAccepter}
              disabled={enCours}
              aria-label="Répondre à l'appel"
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-14"
            >
              {!enCours && (
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40 [animation-duration:1.6s]" />
              )}
              <IconPhone size={26} className="relative" />
            </button>
            <span className="text-xs text-white/60">{enCours ? 'Connexion…' : 'Répondre'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
