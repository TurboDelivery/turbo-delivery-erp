'use client';

import React from 'react';

import CarteStat from '@/components/commons/CarteStat';

interface StatCardProps {
  label: string;
  value: number;
  highlight?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Carte de statistique des ecrans Coursiers et Partenaires.
 *
 * <p>Enveloppe `CarteStat` en conservant sa signature, pour ne pas toucher ses points
 * d'appel. Elle etait la derniere carte de statistique a redefinir son propre habillage
 * plutot qu'a s'appuyer sur le composant partage.</p>
 *
 * <p>`highlight` peignait toute la surface en `bg-primary` avec du texte blanc en dur.
 * C'est une mise en avant, pas une couleur : elle devient `accent`, qui teinte la surface
 * a partir du ton. Le chiffre restait `text-primary` dans les deux branches, il devient
 * donc le ton `primaire` partout, ce qui preserve la hierarchie sans classe en dur.</p>
 *
 * <p>Defaut corrige : la carte etait un `<div onClick>`. Elle se comportait en bouton sans
 * en etre un, donc inatteignable au clavier alors qu'elle filtre le tableau. `CarteStat`
 * rend un vrai `<button>` avec `aria-pressed` des qu'un `onClick` est fourni.</p>
 *
 * <p>`isLink` est retire : aucun appelant ne le passait, et sa branche n'affichait pas de
 * chiffre du tout, seulement un libelle et une fleche. Ce n'etait pas une carte de
 * statistique mais une tuile de navigation, qui n'a pas sa place dans cette signature.</p>
 */
export function StatCard({ label, value, highlight, isActive, onClick }: StatCardProps) {
  return (
    <CarteStat
      libelle={label}
      valeur={value}
      ton="primaire"
      accent={highlight}
      estActif={isActive}
      onClick={onClick}
    />
  );
}
