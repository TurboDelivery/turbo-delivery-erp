'use client';

import { RefObject, useEffect, useState } from 'react';

/**
 * Plancher volontairement bas : au-dessus, il redevient possible qu'un bloc « au minimum »
 * dépasse une fenêtre courte et fasse défiler la page — exactement ce qu'on veut éviter.
 * Sur une fenêtre de 560 px de haut, l'espace réellement disponible tourne autour de 370 px.
 */
const HAUTEUR_MINIMALE = 320;
/** Point de rupture `lg` de Tailwind : en dessous, les mises en page s'empilent. */
const RUPTURE_COTE_A_COTE = 1024;

/**
 * Hauteur de tout ce qui reste APRÈS le bloc dans la page : marges basses des conteneurs
 * traversés, pied de page applicatif, etc.
 *
 * <p>Se calcule en remontant les parents et en additionnant leurs frères suivants. Deux
 * raisons de procéder ainsi plutôt que de soustraire le « scrollHeight » du document : le
 * résultat ne dépend pas de la hauteur du bloc lui-même (donc aucune boucle), et il reste
 * juste quand le document devient plus court que la fenêtre — cas où `scrollHeight` est
 * plafonné à la hauteur de la fenêtre et fausserait tout calcul par différence.</p>
 */
function hauteurSousLeBloc(element: HTMLElement): number {
  let total = 0;
  let courant: HTMLElement | null = element;

  while (courant && courant !== document.body && courant.parentElement) {
    for (let frere = courant.nextElementSibling; frere; frere = frere.nextElementSibling) {
      const style = window.getComputedStyle(frere);
      // Un élément sorti du flux (menu déroulant, info-bulle, bouton flottant) ne pousse
      // rien : le compter reviendrait à rétrécir le bloc sans raison.
      if (style.display === 'none' || style.position === 'fixed' || style.position === 'absolute') {
        continue;
      }
      total += frere.getBoundingClientRect().height;
    }
    total += parseFloat(window.getComputedStyle(courant.parentElement).paddingBottom) || 0;
    courant = courant.parentElement;
  }

  return total;
}

/**
 * Hauteur exacte qu'un bloc peut occuper sans faire défiler la page.
 *
 * <p>À réserver aux écrans « poste de travail » — ceux qui doivent tenir dans la fenêtre parce
 * qu'ils font défiler leur contenu à l'intérieur (carte + liste du trafic, liste + visionneuse
 * de preuve du visa DGA). Une page faite pour défiler n'a rien à y gagner.</p>
 *
 * <p>Un `calc(100vh - Xrem)` écrit à la main suppose une hauteur d'en-tête connue ; or elle
 * change quand les compteurs arrivent, quand un titre passe sur deux lignes, ou quand le thème
 * horizontal ajoute son menu. La distance réelle est donc mesurée plutôt que devinée.</p>
 *
 * @returns la hauteur en pixels, ou `undefined` tant qu'elle n'est pas mesurée et sur les
 *          écrans étroits (où la mise en page empilée garde ses hauteurs naturelles).
 */
export function useHauteurDisponible(reference: RefObject<HTMLElement | null>): number | undefined {
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
      // pendant un défilement, la seconde grandirait, ce qui allongerait le bloc, ce qui
      // permettrait de défiler davantage — une boucle. Ce qui est au-dessus du bloc ne bouge
      // pas quand le bloc change de taille, la mesure est donc stable.
      const depuisLeHautDuDocument = element.getBoundingClientRect().top + window.scrollY;
      const disponible = window.innerHeight - depuisLeHautDuDocument - hauteurSousLeBloc(element);
      const cible = Math.max(HAUTEUR_MINIMALE, Math.round(disponible));
      // Un écart d'un pixel (arrondi de rendu) ne justifie pas un nouveau rendu, et évite
      // qu'un aller-retour d'un pixel entretienne l'observateur de redimensionnement.
      setHauteur((precedente) =>
        precedente !== undefined && Math.abs(precedente - cible) <= 1 ? precedente : cible);
    };

    mesurer();
    window.addEventListener('resize', mesurer);

    // Le contenu au-dessus (compteurs, filtres, en-tête de page) grandit après le premier
    // rendu : sans observateur, la mesure initiale resterait fausse jusqu'au prochain
    // redimensionnement de la fenêtre.
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(document.body);

    return () => {
      window.removeEventListener('resize', mesurer);
      observateur.disconnect();
    };
  }, [reference]);

  return hauteur;
}
