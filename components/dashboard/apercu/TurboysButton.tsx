import { ChevronRight } from 'lucide-react';

import { LienBouton } from '@/components/commons/LienBouton';
import { TurboyType } from '@/features/turboys/types/turboys.types';

/**
 * 2026-05-29 — La cible historique {@code /delivery-men/turboys} pointait sur
 * l'ancien tableau (route group {@code (valided)/turboys}) qui n'est plus la
 * source de vérité depuis l'introduction de {@code /delivery-men/men}. Le
 * paramètre {@code tab} aligne l'URL sur le format attendu par
 * {@code useTurboyFilters} pour que la carte sélectionnée soit déjà cochée
 * à l'arrivée.
 */
export function TurboysButton({ name, param, value=0 }: { name: string; param: TurboyType; value?: number }) {
  const tab = TYPE_TO_TAB[param];
  return (
    /* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */
    <LienBouton
      className="text-xs font-medium"
      href={`/delivery-men/men?typeLivreur=${param}&tab=${tab}`}
      taille="sm"
      variante="ghost"
    >
      {name} ({value})
      <ChevronRight aria-hidden="true" className="size-3.5" />
    </LienBouton>
  );
}

const TYPE_TO_TAB: Record<TurboyType, string> = {
  INDEPENDANT: 'independant',
  JOURNALIER: 'journalier',
  SUPERVISEUR_LIVREUR: 'superviseur_livreur',
};
