'use client';

import { Pagination } from '@heroui-v3/react';
import React from 'react';

/**
 * La pagination des tableaux du module Recouvrements.
 *
 * <p>Elle était recopiée à l'identique dans quatre fichiers, sous la forme d'un
 * `<Pagination color="primary">` de la v2. Elle est montée une fois.</p>
 */
export function PaginationTableau({
  onPage,
  page,
  total,
}: {
  onPage: (p: number) => void;
  page: number;
  total: number;
}) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <Pagination size="sm">
      <Pagination.Summary>
        Page {page} sur {total}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page === 1} onPress={() => onPage(page - 1)}>
            <Pagination.PreviousIcon />
            Précédent
          </Pagination.Previous>
        </Pagination.Item>
        {pages.map((p) => (
          <Pagination.Item key={p}>
            <Pagination.Link isActive={p === page} onPress={() => onPage(p)}>
              {p}
            </Pagination.Link>
          </Pagination.Item>
        ))}
        <Pagination.Item>
          <Pagination.Next isDisabled={page === total} onPress={() => onPage(page + 1)}>
            Suivant
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
