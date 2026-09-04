'use client';

/*
 * Le panneau reprend `Card` de la V3, comme sa liste jumelle « Validés V1 ». Sa surface,
 * son rayon, sa bordure et son rembourrage etaient ecrits a la main ici (`bg-surface
 * rounded-2xl border border-separator p-5`) : deux panneaux cote a cote redecrivaient le
 * meme fond dans deux fichiers, et un reglage de theme devait etre reporte dans chacun.
 */
import { Card, Chip, Spinner } from '@heroui-v3/react';
import { useEffect, useRef } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';

import TicketReadyCard from './TicketReadyCard';
import { TicketControleV2 } from '../types/tickets-v2.type';

interface Props {
  isError?: boolean;
  onReessayer?: () => void;
  tickets: TicketControleV2[];
  total: number;
  onLock: (ticketId: string) => void;
  onReject: (ticketId: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export default function TicketReadyList({ tickets, total, onLock, onReject, hasNextPage, isFetchingNextPage, fetchNextPage, isError = false, onReessayer }: Props) {
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
          {/* La pastille etait en `bg-green-500`, une couleur ecrite en dur sans variante
              sombre : depuis que la bascule de theme est dans l'en-tete, elle gardait son
              vert vif quel que soit le fond. `bg-success` dit la meme chose (ces tickets
              sont authentifies et attendent V1) et suit les deux themes. Le titre dit
              deja lequel des deux panneaux on lit : la couleur ne porte pas seule le
              sens. */}
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-success" />
          <Card.Title>Prêts pour V1</Card.Title>
        </div>
        {/* Le compteur etait une pastille bleue peinte a la main (`bg-blue-100
            text-blue-700`), elle aussi sans variante sombre. `Chip` la rend, et les deux
            files affichent desormais leur total dans la meme forme : les deux nombres se
            comparent d'un panneau a l'autre. */}
        <Chip size="sm">{total}</Chip>
      </Card.Header>

      {/* Un seul conteneur defilant, comme avant : la sentinelle de pagination reste
          montee dans TOUS les etats. Sortie dans une branche, elle disparaissait quand la
          premiere page revenait vide, et une file qui annonce d'autres pages restait
          bloquee sur « aucun ticket ». */}
      <Card.Content ref={scrollRef} className="min-h-0 gap-2 overflow-y-auto pe-1">
        {/* Un echec de chargement ne doit pas se lire comme une periode sans ticket. */}
        {isError && <EtatErreur quoi="les tickets à vérifier" onReessayer={onReessayer} />}
        {!isError && tickets.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">Aucun ticket à vérifier pour cette période.</p>
        )}
        {tickets.map((ticket) => (
          <TicketReadyCard key={ticket.commandeId} ticket={ticket} onLock={onLock} onReject={onReject} />
        ))}
        {/* Le rond de chargement etait dessine a la main (`Loader2` + `animate-spin`) ;
            `Spinner` est le composant de la bibliotheque. `color="current"` lui donne le
            gris de la ligne : l'accent reste reserve a ce qui appelle une action, et ici
            les actions sont les boutons V1 et Rejeter des cartes. */}
        <div ref={bottomRef} className="flex shrink-0 items-center justify-center py-1 text-muted">
          {isFetchingNextPage && <Spinner color="current" size="sm" />}
        </div>
      </Card.Content>
    </Card>
  );
}
