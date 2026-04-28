'use client';

import React from 'react';
import { Loader2, Trash } from 'lucide-react';
import { Button } from '@heroui/react';

import { Ticket } from '@/types/bon-livraison.model';

interface TicketTableActionsProps {
  ticketsData: Ticket[];
  selectedRows: string[];
  permissions: { canDelete: boolean };
  isDeletingBonLivraison: boolean;
  onDeleteRows: () => void;
}

export function TicketTableActions({ selectedRows, permissions, isDeletingBonLivraison, onDeleteRows }: TicketTableActionsProps) {
  return (
    <div className="px-1 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onPress={onDeleteRows}
          variant="bordered"
          color="danger"
          isDisabled={!permissions.canDelete || selectedRows.length === 0 || isDeletingBonLivraison}
          startContent={isDeletingBonLivraison ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}
