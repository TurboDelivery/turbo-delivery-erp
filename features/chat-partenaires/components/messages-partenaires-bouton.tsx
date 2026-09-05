'use client';

import { Chip } from '@heroui-v3/react';
import { MessagesSquare } from 'lucide-react';
import { useMemo } from 'react';

import { LienBouton } from '@/components/commons/LienBouton';

import { useNonLusQuery } from '../queries/chat-partenaires.query';

/**
 * Accès discret au chat partenaires depuis la console STANDARD : bouton texte
 * avec pastille de non-lus (rafraîchie toutes les 15 s, comme le chat).
 */
export function MessagesPartenairesBouton() {
  const nonLus = useNonLusQuery();

  const total = useMemo(
    () => (nonLus.data ?? []).reduce((somme, n) => somme + n.nonLus, 0),
    [nonLus.data],
  );

  return (
    /* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */
    <LienBouton href="/trafic/standard/messages-partenaires" variante="ghost">
      <MessagesSquare aria-hidden="true" className="size-4" />
      Messages partenaires
      {total > 0 && (
        <Chip color="danger" size="sm" variant="soft">
          <Chip.Label>{total}</Chip.Label>
        </Chip>
      )}
    </LienBouton>
  );
}
