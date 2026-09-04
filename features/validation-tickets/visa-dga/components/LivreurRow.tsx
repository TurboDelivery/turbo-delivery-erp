import { Chip } from '@heroui-v3/react';
import { Star } from 'lucide-react';

import { formatMontant } from '@/utils/format.utils';
import { IVisaDgaLivreur } from '../types/visa-dga.type';

/**
 * Ligne d'un livreur dans le recapitulatif du lot soumis au visa.
 *
 * <p>La pastille BONUS et le montant etaient peints avec des teintes Tailwind fixes
 * (`bg-amber-100 text-amber-600`, `fill-amber-500`, `text-green-600`), aucune avec sa
 * variante sombre. Depuis que la bascule de theme est dans l'en-tete, le pastel de la
 * pastille restait clair sur une carte sombre, et le vert du montant s'y refermait :
 * l'operateur relisait mal les sommes qu'il s'apprete a autoriser en virement Wave
 * reel. `Chip` porte l'echelle `warning` et suit le theme. Pour le montant, la teinte
 * est `text-success-soft-foreground`, celle de l'echelle `success` prevue pour du
 * TEXTE, la forme nue `text-success-soft-foreground` etant un ton de remplissage trop faible a lire.</p>
 *
 * <p>Les chiffres passent en chasse tabulaire. Les lignes finissent deja au meme bord
 * droit, mais avec des chiffres a chasse variable les rangs des milliers ne tombaient
 * pas les uns sous les autres : comparer deux paies d'un coup d'oeil obligeait a les
 * relire l'une apres l'autre. Le numero Wave y gagne aussi, un numero se verifie chiffre
 * par chiffre.</p>
 */
export default function LivreurRow({ nom, tickets, numeroWave, netAPayer, bonus }: IVisaDgaLivreur) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-separator py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{nom}</p>
        <p className="mt-0.5 truncate text-[11px] tabular-nums text-muted">
          {tickets} tickets · {numeroWave}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {bonus && (
          <Chip color="warning" size="md" variant="soft">
            <Star aria-hidden="true" className="h-3 w-3 fill-current" />
            {/* Le mot reste ecrit : sans lui, la prime ne tiendrait qu'a la couleur de la pastille. */}
            <Chip.Label>BONUS</Chip.Label>
          </Chip>
        )}
        <span className="text-sm font-bold tabular-nums text-success-soft-foreground">
          {formatMontant(netAPayer)}
        </span>
      </div>
    </div>
  );
}
