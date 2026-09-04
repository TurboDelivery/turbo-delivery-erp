'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/heroui';
import { MessagesSquare } from 'lucide-react';

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
    <Button
      as={Link}
      href="/trafic/standard/messages-partenaires"
      variant="light"
      className="text-default-600"
      startContent={<MessagesSquare className="h-4 w-4" />}
      endContent={
        total > 0 ? (
          <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">
            {total}
          </span>
        ) : undefined
      }
    >
      Messages partenaires
    </Button>
  );
}
