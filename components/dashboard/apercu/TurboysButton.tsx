import { Button, Link } from '@heroui/react';
import { ChevronRight } from 'lucide-react';
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
    <Button
      variant="light"
      as={Link}
      className="text-muted-foreground text-xs font-medium"
      href={`/delivery-men/men?typeLivreur=${param}&tab=${tab}`}
    >
      {name} ({value})
      <ChevronRight className="inline-block ml-1" size={14} />
    </Button>
  );
}

const TYPE_TO_TAB: Record<TurboyType, string> = {
  INDEPENDANT: 'independant',
  JOURNALIER: 'journalier',
  SUPERVISEUR_LIVREUR: 'superviseur_livreur',
};
