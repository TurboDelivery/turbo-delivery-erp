'use client';

/*
 * Le panneau reprend `Card` de la V3. Sa surface, son rayon et son ombre etaient jusqu'ici
 * ecrits a la main (`bg-surface rounded-2xl border border-separator p-5`) : chaque reglage
 * de theme devait etre reporte ici, alors que le composant le porte deja.
 */
import { Card, Chip, Spinner } from '@heroui-v3/react';
import { Lock } from 'lucide-react';
import { useEffect, useRef } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import { TicketControleV2 } from '../types/tickets-v2.type';

interface Props {
  isError?: boolean;
  onReessayer?: () => void;
  tickets: TicketControleV2[];
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export default function TicketLockedList({ tickets, total, hasNextPage, isFetchingNextPage, fetchNextPage, isError = false, onReessayer }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage(); },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <Card className="max-h-[70vh] flex-1">
      <Card.Header className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-foreground" />
          <Card.Title>Validés V1</Card.Title>
        </div>
        <Chip size="sm">{total}</Chip>
      </Card.Header>

      {isError ? (
        /* Un echec de chargement ne doit pas se lire comme une periode sans ticket. */
        <Card.Content className="items-center justify-center">
          <EtatErreur quoi="les tickets validés V1" onReessayer={onReessayer} />
        </Card.Content>
      ) : tickets.length === 0 ? (
        <Card.Content className="items-center justify-center py-16">
          <p className="text-sm text-muted">Aucun ticket validé V1 pour cette période.</p>
        </Card.Content>
      ) : (
        <Card.Content ref={scrollRef} className="min-h-0 gap-3 overflow-y-auto pe-1">
          {tickets.map((ticket) => (
            <div
              key={ticket.commandeId}
              className="flex flex-col gap-1.5 rounded-xl border border-separator bg-surface-secondary px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-bold text-foreground">{ticket.reference}</span>
                  <span className="truncate text-xs uppercase tracking-wide text-muted">{ticket.restaurant}</span>
                </div>
                <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-muted">CMD</span>
                <span className="font-semibold tabular-nums text-foreground">{formatCFA(ticket.coutCommande)}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">LIV</span>
                <span className="font-semibold tabular-nums text-foreground">{formatCFA(ticket.coutLivraison)}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">COM</span>
                {/* La commission etait en `text-green-600`, sans variante sombre : ce vert
                    fonce restait tel quel sur fond sombre et le seul montant qui compte pour
                    la paie perdait son contraste. `text-success-soft-foreground` dit la meme chose et suit
                    les deux themes. */}
                <span className="font-semibold tabular-nums text-success-soft-foreground">
                  {ticket.commission != null ? formatCFA(ticket.commission) : '—'}
                </span>
              </div>
              {ticket.createdByUser && (
                <div className="flex items-center gap-1 text-xs text-muted">
                  <span>Créé par</span>
                  <span className="font-medium text-muted">
                    {ticket.createdByUser.prenoms} {ticket.createdByUser.nom}
                  </span>
                </div>
              )}
            </div>
          ))}
          {/* Sentinelle de pagination. Le rond de chargement etait dessine a la main
              (`Loader2` + `animate-spin`) ; `Spinner` est le composant de la bibliotheque.
              `color="current"` lui donne le gris de la ligne : l'accent reste reserve a ce
              qui appelle une action. */}
          <div ref={bottomRef} className="flex shrink-0 items-center justify-center py-1 text-muted">
            {isFetchingNextPage && <Spinner color="current" size="sm" />}
          </div>
        </Card.Content>
      )}
    </Card>
  );
}
