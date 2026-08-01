'use client';

import { RefObject, useEffect, useState } from 'react';

/**
 * Plancher volontairement bas : au-dessus, il redevient possible qu'une carte « au minimum »
 * dépasse une fenêtre courte et fasse défiler la page — exactement ce qu'on veut éviter. Sur
 * une fenêtre de 560 px de haut, l'espace réellement disponible tourne autour de 370 px.
 */
const HAUTEUR_MINIMALE = 320;
/** Respiration sous la zone, pour ne pas coller au bas de la fenêtre. */
const MARGE_BASSE = 24;
/** Point de rupture `lg` de Tailwind : en dessous, carte et liste s'empilent. */
const RUPTURE_COTE_A_COTE = 1024;

/**
 * Hauteur exacte que la zone « carte + liste » peut occuper sans faire défiler la page.
 *
 * <p>Un `calc(100vh - Xrem)` écrit à la main suppose une hauteur d'en-tête connue ; or le
 * bandeau de compteurs change de hauteur quand les chiffres arrivent et passe sur deux
 * lignes selon la largeur. La distance réelle est donc mesurée plutôt que devinée.</p>
 *
 * @returns la hauteur en pixels, ou `undefined` tant qu'elle n'est pas mesurée et sur les
 *          écrans étroits (où la mise en page empilée garde ses hauteurs naturelles).
 */
export function useHauteurZoneCarte(reference: RefObject<HTMLElement>): number | undefined {
  const [hauteur, setHauteur] = useState<number>();

  useEffect(() => {
    const element = reference.current;
    if (!element) {
      return;
    }

    const mesurer = () => {
      if (window.innerWidth < RUPTURE_COTE_A_COTE) {
        setHauteur(undefined);
        return;
      }
      // Distance depuis le haut du DOCUMENT, et non depuis le haut de la fenêtre : prise
      // pendant un défilement, la seconde grandirait, ce qui allongerait la zone, ce qui
      // permettrait de défiler davantage — une boucle. Ce qui est au-dessus de la zone ne
      // bouge pas quand la zone change de taille, la mesure est donc stable.
      const depuisLeHautDuDocument = element.getBoundingClientRect().top + window.scrollY;
      const disponible = window.innerHeight - depuisLeHautDuDocument - MARGE_BASSE;
      setHauteur(Math.max(HAUTEUR_MINIMALE, Math.round(disponible)));
    };

    mesurer();
    window.addEventListener('resize', mesurer);

    // Le contenu au-dessus (compteurs, filtres) grandit après le premier rendu : sans
    // observateur, la mesure initiale resterait fausse jusqu'au prochain redimensionnement.
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(document.body);

    return () => {
      window.removeEventListener('resize', mesurer);
      observateur.disconnect();
    };
  }, [reference]);

  return hauteur;
}
