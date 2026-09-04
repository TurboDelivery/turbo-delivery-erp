'use client';

import { Chip } from '@heroui-v3/react';
import { Clock } from 'lucide-react';
import { formatMontant } from '@/utils/format.utils';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';

interface Props {
  ticket: BonLivraisonTerminee;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/*
 * La ligne reste un <button> natif. Le `Button` de la V3 impose une hauteur fixe, un rayon
 * pleine rondeur, un contenu centre sur une seule ligne et une taille d'icone forcee : en
 * faire une ligne de file pleine largeur sur deux niveaux aurait demande de reecrire son
 * habillage classe par classe, ce que le projet refuse. La capacite est signalee, pas retiree.
 */
export default function RegularisationQueueItem({ ticket, isSelected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ticket.commandeId)}
      /*
       * La ligne ouverte dans le panneau de droite ne se distinguait qu'a la couleur. Un
       * operateur au clavier ou au lecteur d'ecran parcourait la file sans jamais savoir
       * quel ticket il etait en train de lire a cote.
       */
      aria-current={isSelected}
      className={`flex w-full items-center gap-3 border-s-4 px-4 py-3 text-left transition-colors ${
        isSelected ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-surface-secondary'
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-foreground">{ticket.reference}</span>
        <span className="truncate text-xs text-muted">
          {ticket.livreur} · {ticket.restaurant}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        {/* Chasse tabulaire : les montants de la file se comparent d'une ligne a l'autre,
            sinon les chiffres se decalent et les ordres de grandeur ne se voient plus. */}
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatMontant(ticket.coutCommande)}
        </span>

        {/*
         * L'heure portait `text-orange-500` et son horloge un rond `bg-orange-100` : deux
         * teintes en dur, sans variante sombre, qui restaient eclatantes des que l'operateur
         * basculait le theme. Le rond disait par ailleurs la meme chose sur toutes les lignes
         * (elles sont toutes en attente) : il ne distinguait rien. La puce d'alerte porte
         * maintenant l'horloge et l'heure ensemble, comme dans le panneau de detail.
         */}
        <Chip color="warning" size="sm" variant="soft">
          <Clock aria-hidden="true" className="size-3" />
          <Chip.Label>{ticket.heure}</Chip.Label>
        </Chip>
      </span>
    </button>
  );
}
