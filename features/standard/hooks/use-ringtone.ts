'use client';

import { useEffect, useRef } from 'react';

/** Sonneries : `entrant` = ça sonne CHEZ MOI, `retour` = tonalité d'attente CHEZ L'APPELANT. */
export type TypeSonnerie = 'entrant' | 'retour';

const FICHIERS: Record<TypeSonnerie, string> = {
  entrant: '/sons/sonnerie-entrante.mp3',
  retour: '/sons/retour-appel.mp3',
};

const VOLUMES: Record<TypeSonnerie, number> = {
  entrant: 0.9,
  retour: 0.45, // tonalité d'attente : discrète
};

/**
 * Joue une sonnerie en boucle tant que {@code actif} est vrai.
 *
 * <p>Implémentation via un élément {@code <audio loop>} (et NON l'API Web Audio
 * pilotée par des timers) : c'est ce qui permet à la sonnerie de continuer quand
 * l'onglet n'est pas au premier plan — les navigateurs throttlent lourdement
 * {@code setInterval} dans un onglet caché, ce qui hachait puis arrêtait l'ancienne
 * sonnerie synthétisée, alors que la lecture d'un média n'est pas suspendue.</p>
 *
 * <p>Autoplay : si le navigateur refuse la lecture (aucune interaction préalable),
 * on réessaie automatiquement au premier geste de l'utilisateur (clic/touche/tap).</p>
 *
 * <p>Pour un appel entrant, le titre de l'onglet clignote également afin d'attirer
 * l'œil quand la console est en arrière-plan.</p>
 */
export function useRingtone(actif: boolean, type: TypeSonnerie = 'entrant') {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!actif || typeof window === 'undefined') return;

    const audio = new Audio(FICHIERS[type]);
    audio.loop = true;
    audio.volume = VOLUMES[type];
    audio.preload = 'auto';
    audioRef.current = audio;

    let annule = false;
    const retirerEcouteurs = () => {
      window.removeEventListener('pointerdown', relancer);
      window.removeEventListener('keydown', relancer);
      window.removeEventListener('touchstart', relancer);
    };
    function relancer() {
      if (annule) return;
      audio.play().catch(() => {});
      retirerEcouteurs();
    }

    audio.play().catch(() => {
      // Lecture bloquée (politique autoplay) → on retente au premier geste.
      window.addEventListener('pointerdown', relancer, { once: true });
      window.addEventListener('keydown', relancer, { once: true });
      window.addEventListener('touchstart', relancer, { once: true });
    });

    // Clignotement du titre de l'onglet (appel entrant uniquement).
    let flash: number | undefined;
    const titreInitial = document.title;
    if (type === 'entrant') {
      let visible = true;
      flash = window.setInterval(() => {
        document.title = visible ? '📞 Appel entrant…' : titreInitial;
        visible = !visible;
      }, 900);
    }

    return () => {
      annule = true;
      retirerEcouteurs();
      if (flash) window.clearInterval(flash);
      document.title = titreInitial;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* best-effort */
      }
      audioRef.current = null;
    };
  }, [actif, type]);
}
