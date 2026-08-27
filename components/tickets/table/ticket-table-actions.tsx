'use client';

import React from 'react';
import { Loader2, Trash } from 'lucide-react';
import { Button, Tooltip } from '@heroui/react';

import { Ticket } from '@/types/bon-livraison.model';

interface TicketTableActionsProps {
  ticketsData: Ticket[];
  selectedRows: string[];
  permissions: { canDelete: boolean };
  isDeletingBonLivraison: boolean;
  onDeleteRows: () => void;
}

export function TicketTableActions({ selectedRows, permissions, isDeletingBonLivraison, onDeleteRows }: TicketTableActionsProps) {
  // Trois causes grisent ce bouton sans qu'aucune ne soit nommee : on annonce celle qui bloque
  // vraiment, le droit d'abord. La suppression en cours se signale deja par son spinner, elle
  // n'a donc pas de motif et laisse le Tooltip ferme.
  const motifBlocage = !permissions.canDelete
    ? 'Votre rôle ne permet pas de supprimer un ticket'
    : selectedRows.length === 0
      ? 'Sélectionnez au moins une ligne à supprimer'
      : '';

  return (
    <div className="px-1 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Un bouton desactive n'emet aucun survol : le span porte l'evenement a la place. */}
        <Tooltip content={motifBlocage} isDisabled={!motifBlocage} size="sm">
          <span className="inline-flex">
            <Button
              onPress={onDeleteRows}
              variant="bordered"
              color="danger"
              isDisabled={!permissions.canDelete || selectedRows.length === 0 || isDeletingBonLivraison}
              startContent={isDeletingBonLivraison ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
            >
              Supprimer
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
