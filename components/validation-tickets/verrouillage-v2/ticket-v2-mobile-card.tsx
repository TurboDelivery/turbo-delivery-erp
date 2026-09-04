'use client';

import { Card, Chip } from '@heroui-v3/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import { AgentCell, formatDate } from './verrouillage-v2-columns';

/**
 * La carte d'un ticket V2 au telephone, en remplacement du tableau dense sous `md`
 * (cf. l'enveloppe `hidden md:block` / `md:hidden` des deux tables).
 *
 * <p>Elle lit les MEMES donnees que les colonnes et reutilise `AgentCell`, `formatDate`
 * et `formatCFA` : aucune divergence possible entre les deux surfaces. Les actions
 * (Valider V2 / Rejeter) restent fournies par la liste appelante, qui seule connait
 * le role de l'operateur et l'etat d'envoi.</p>
 *
 * <h3>Ce qui change</h3>
 * <ul>
 *   <li>Le cadre etait un `div` habille a la main (`bg-surface`, bordure, arrondi, ombre).
 *       C'est une carte de la bibliotheque : elle suit le theme sans qu'on le redise.</li>
 *   <li>La pastille de zone etait ecrite en `border-green-500 bg-green-50 text-green-700`,
 *       sans variante sombre : depuis que la bascule de theme est dans l'en-tete, elle
 *       s'affichait vert pastel sur fond sombre. Elle passe au `Chip` en couleur success,
 *       qui a ses deux themes.</li>
 *   <li>Les trois montants etaient poses en ligne, separes par des points mediens. Un
 *       operateur qui fait defiler vingt tickets compare des montants : ils rejoignent la
 *       liste libelle/valeur des autres champs, alignes a droite et en chasse tabulaire,
 *       donc comparables d'une carte a l'autre. Les libelles reprennent mot pour mot les
 *       en-tetes du tableau (MONTANT CMD, MONTANT LIV., COMMISSION) plutot que les
 *       abreviations CMD / LIV / COM, qui n'existaient que dans cette carte.</li>
 * </ul>
 */

/** Une valeur en lecture : libelle a gauche, valeur a droite, alignees d'une ligne a l'autre. */
function Champ({ libelle, className, children }: { libelle: string; className?: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted">{libelle}</span>
      <span className={cn('truncate text-right text-sm text-foreground', className)}>{children}</span>
    </div>
  );
}

/** Un maillon de la chaine de controle : qui a fait quoi, et quand. */
function Etape({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted">{libelle}</p>
      {children}
    </div>
  );
}

export default function TicketV2MobileCard({ ticket, actions }: { ticket: TicketControleV2; actions?: ReactNode }) {
  const zone = ticket.nomZone ?? 'VERTE';

  return (
    <Card className="gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{ticket.reference}</p>
          <p className="truncate text-xs text-muted">{ticket.livreur}</p>
        </div>
        {/* Le nom de zone est tronque faute de place : l'info-bulle native donne le nom entier. */}
        <Chip className="max-w-[140px]" color="success" title={zone} variant="soft">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
          <Chip.Label className="truncate">{zone}</Chip.Label>
        </Chip>
      </div>

      <Champ className="text-blue-600 dark:text-blue-400" libelle="Partenaire">
        {ticket.restaurant}
      </Champ>
      <Champ libelle="Date">{formatDate(ticket.date)}</Champ>
      <Champ className="font-semibold tabular-nums" libelle="Montant CMD">
        {formatCFA(ticket.coutCommande)}
      </Champ>
      <Champ className="font-semibold tabular-nums" libelle="Montant LIV.">
        {formatCFA(ticket.coutLivraison)}
      </Champ>
      <Champ className="font-semibold tabular-nums text-success-soft-foreground" libelle="Commission">
        {ticket.commission != null ? formatCFA(ticket.commission) : '—'}
      </Champ>

      <div className="grid grid-cols-2 gap-2 border-t border-separator pt-2 text-xs">
        <Etape libelle="Créé par">
          <AgentCell agent={ticket.createdByUser} />
        </Etape>
        <Etape libelle="Auth par">
          <AgentCell agent={ticket.vauthAgent} date={ticket.vauthAt} />
        </Etape>
        <Etape libelle="V1 par">
          <AgentCell agent={ticket.v1Agent} date={ticket.v1ValideAt} />
        </Etape>
        <Etape libelle="V2 par">
          <AgentCell agent={ticket.v2Agent} date={ticket.v2ValideAt} />
        </Etape>
      </div>

      {/*
       * Les actions restent dans un bloc et non dans `Card.Footer` : le pied de carte
       * est une rangee flex, ou le groupe de boutons `fullWidth` cesserait de s'etendre
       * et redeviendrait deux cibles etroites au doigt.
       */}
      {actions && <div className="pt-1">{actions}</div>}
    </Card>
  );
}
