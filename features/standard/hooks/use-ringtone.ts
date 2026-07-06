'use client';

import { useEffect } from 'react';

/**
 * Joue une sonnerie d'appel en boucle tant que {@code actif} est vrai, générée
 * via l'API Web Audio (aucun fichier externe → compatible CSP stricte). Motif
 * type téléphone : deux salves d'~0,4 s séparées d'un court silence, puis pause,
 * en boucle. En complément, fait clignoter le titre de l'onglet pour attirer
 * l'attention même quand l'onglet n'est pas au premier plan.
 *
 * Note navigateur : l'{@code AudioContext} peut démarrer suspendu si aucune
 * interaction récente n'a eu lieu ; on tente {@code resume()}. Un opérateur
 * STANDARD actif a normalement déjà interagi avec la page → le son se joue.
 */
export function useRingtone(actif: boolean) {
  useEffect(() => {
    if (!actif) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctx.resume().catch(() => {});

    let stopped = false;

    const salve = (debut: number) => {
      // Deux tonalités superposées (proche d'un « ringback ») avec enveloppe douce.
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, debut);
        gain.gain.linearRampToValueAtTime(0.15, debut + 0.03);
        gain.gain.setValueAtTime(0.15, debut + 0.37);
        gain.gain.linearRampToValueAtTime(0, debut + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(debut);
        osc.stop(debut + 0.42);
      });
    };

    const jouerCycle = () => {
      if (stopped) return;
      const t = ctx.currentTime + 0.05;
      salve(t); // « dring »
      salve(t + 0.6); // « dring »
    };

    jouerCycle();
    const interval = window.setInterval(jouerCycle, 3000);

    // Clignotement du titre de l'onglet.
    const titreInitial = document.title;
    let visible = true;
    const flash = window.setInterval(() => {
      document.title = visible ? '● Appel entrant…' : titreInitial;
      visible = !visible;
    }, 900);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.clearInterval(flash);
      document.title = titreInitial;
      ctx.close().catch(() => {});
    };
  }, [actif]);
}
