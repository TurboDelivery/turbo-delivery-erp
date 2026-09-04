'use client';

import { Lock, XCircle } from 'lucide-react';
import { Button, Chip } from '@heroui-v3/react';

import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { TicketControleV2 } from '../types/tickets-v2.type';

interface Props {
  ticket: TicketControleV2;
  onLock: (ticketId: string) => void;
  onReject: (ticketId: string) => void;
}

/**
 * Une ligne de la file « Prets pour V1 » : le ticket, ses trois montants, et les deux
 * seules decisions possibles a ce stade — verrouiller en V1, ou rejeter.
 *
 * <h3>Ce qui etait casse</h3>
 * <ul>
 *   <li>Toute la carte etait peinte a la main, fond `green-50` et bordure `green-100`,
 *       SANS variante sombre. Depuis que la bascule de theme est dans l'en-tete, la file
 *       entiere s'affichait en vert pastel sur fond sombre, illisible. Le vert dit ici
 *       quelque chose (le ticket est authentifie, il attend V1) : il est conserve, mais
 *       par le jeton `success-soft`, qui se retourne avec le theme.</li>
 *   <li>Le montant de commission etait en texte `green-600`, meme probleme, meme
 *       correction avec `success-soft-foreground`.</li>
 *   <li>Les deux boutons etaient rhabilles a la main (pilule, fond, texte, survol) alors
 *       que `variant` porte deja cette distinction : l'action normale contre l'action
 *       destructrice. Une pilule noire et une pilule rouge de meme poids ne hierarchisent
 *       rien ; les variantes primary et danger, si.</li>
 *   <li>La pastille shadcn trainait un `hover:` sur un element qui ne se clique pas :
 *       elle changeait de couleur au passage de la souris et laissait croire a un
 *       bouton. `Chip` n'a pas cet artefact.</li>
 * </ul>
 *
 * <p>Les icones n'ont plus de taille ecrite ici : le bouton v3 dimensionne deja ses svg
 * selon sa propre taille, une classe posee dessus se contenterait de diverger.</p>
 */
export default function TicketReadyCard({ ticket, onLock, onReject }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-separator bg-success-soft px-4 py-3">
      {/* Référence + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-foreground">{ticket.reference}</span>
          <span className="truncate text-xs text-muted">{ticket.restaurant}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Chip color="success" size="sm" variant="soft">
            Authentifié
          </Chip>
          <Button onPress={() => onLock(ticket.commandeId)} size="sm" variant="primary">
            <Lock aria-hidden="true" />
            V1
          </Button>
          <Button onPress={() => onReject(ticket.commandeId)} size="sm" variant="danger">
            <XCircle aria-hidden="true" />
            Rejeter
          </Button>
        </div>
      </div>

      {/* Montants — chasse tabulaire pour que les ordres de grandeur se comparent d'une
          ligne a l'autre dans la file. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-muted">CMD</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatCFA(ticket.coutCommande)}
        </span>
        <span className="text-muted">·</span>
        <span className="text-muted">LIV</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatCFA(ticket.coutLivraison)}
        </span>
        <span className="text-muted">·</span>
        <span className="text-muted">COM</span>
        <span className="font-semibold tabular-nums text-success-soft-foreground">
          {ticket.commission != null ? formatCFA(ticket.commission) : '—'}
        </span>
      </div>

      {ticket.createdByUser && (
        <div className="flex items-center gap-1 text-xs text-muted">
          <span>Créé par</span>
          <span className="font-medium">
            {ticket.createdByUser.prenoms} {ticket.createdByUser.nom}
          </span>
        </div>
      )}
    </div>
  );
}
