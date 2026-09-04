import { Chip, type ChipProps } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { StatutVisaDga } from '../types/visa-dga.type';

/**
 * Pastille d'etat du dossier de visa, rendue par `Chip`.
 *
 * <p>C'etait un `span` habille a la main : trois etats en aplat sature
 * (`bg-amber-500`, `bg-green-500`, `bg-red-500`) et un quatrieme en pastel clair
 * (`bg-blue-100 text-blue-700`), aucun avec sa variante sombre. Depuis que la bascule de
 * theme est dans l'en-tete, le calcul en cours s'affichait en bleu pale sur fond sombre,
 * a quelques pixels du titre : le DGA ne lisait plus l'etat du seul dossier qu'il vient
 * viser ou rejeter.</p>
 *
 * <p>Quatre des cinq crans tombent sur l'echelle semantique de la v3 : attente, soumis,
 * vise, rejete. Le calcul en cours garde une teinte Tailwind faute d'equivalent, `accent`
 * valant ici le rouge de marque, qui se confondrait avec `danger`, c'est-a-dire avec
 * REJETE. Cette teinte porte desormais sa variante sombre.</p>
 *
 * <p>L'aplat est conserve sur les trois etats qui engagent une decision (soumis, vise,
 * rejete) et le fond doux sur les deux etats passifs : c'est ce contraste qui disait a
 * l'operateur, d'un coup d'oeil, si le dossier attend encore ou s'il est tranche. Le
 * libelle reste toujours ecrit, pour que l'etat ne tienne jamais qu'a la couleur.</p>
 */
type Pastille = {
  label: string;
  couleur: ChipProps['color'];
  variante: ChipProps['variant'];
  /** Teinte hors echelle, posee uniquement quand aucun `color` ne dit la bonne chose. */
  teinte?: string;
};

const PASTILLE: Record<StatutVisaDga, Pastille> = {
  EN_ATTENTE: { label: 'EN ATTENTE', couleur: 'default', variante: 'soft' },
  CALCUL_EN_COURS: {
    label: 'CALCUL EN COURS',
    couleur: 'default',
    variante: 'soft',
    teinte: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300',
  },
  SOUMIS_DGA: { label: 'SOUMIS DGA', couleur: 'warning', variante: 'primary' },
  VISE: { label: 'VISÉ', couleur: 'success', variante: 'primary' },
  REJETE: { label: 'REJETÉ', couleur: 'danger', variante: 'primary' },
};

export default function VisaDgaStatutBadge({ statut }: { statut: StatutVisaDga }) {
  const { label, couleur, variante, teinte } = PASTILLE[statut];

  return (
    <Chip className={cn('whitespace-nowrap', teinte)} color={couleur} size="md" variant={variante}>
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}
