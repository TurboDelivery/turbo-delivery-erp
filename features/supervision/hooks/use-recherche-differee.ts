'use client';

import { useEffect, useState } from 'react';

/**
 * Champ de recherche à frappe différée.
 *
 * Les journaux d'audit sont paginés côté serveur : sans ce délai, chaque touche
 * déclencherait une requête — et, règle de gestion 5 oblige, une ligne
 * CONSULTATION_AUDIT de plus dans le journal. Le délai protège autant le backend
 * que la lisibilité du journal des consultations.
 *
 * @returns `[saisie, setSaisie, valeurDifferee]`
 */
export function useRechercheDifferee(
  initiale = '',
  delaiMs = 400,
): [string, (valeur: string) => void, string] {
  const [saisie, setSaisie] = useState(initiale);
  const [differee, setDifferee] = useState(initiale);

  useEffect(() => {
    const id = setTimeout(() => setDifferee(saisie), delaiMs);
    return () => clearTimeout(id);
  }, [saisie, delaiMs]);

  return [saisie, setSaisie, differee];
}
