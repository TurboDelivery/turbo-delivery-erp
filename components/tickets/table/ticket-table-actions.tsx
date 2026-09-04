'use client';

import React from 'react';
import { Button,
Spinner, Tooltip } from '@heroui-v3/react';
import { Trash } from 'lucide-react';

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
        {/*
          En v3 l'info-bulle enveloppe son declencheur et son contenu, et elle s'affiche
          meme sur un bouton desactive : l'enveloppe `span` qui portait l'evenement a la
          place du bouton n'a plus lieu d'etre. `color="danger"` et `startContent` etaient
          des props v2 : sur un composant v3 elles seraient ignorees en silence.
        */}
        <Tooltip>
          <Button
            isDisabled={!permissions.canDelete || selectedRows.length === 0}
            isPending={isDeletingBonLivraison}
            onPress={onDeleteRows}
            variant="danger-soft"
          >
            {isDeletingBonLivraison ? <Spinner color="current" size="sm" /> : <Trash aria-hidden="true" className="size-4" />}
            Supprimer
          </Button>
          <Tooltip.Content>
            {motifBlocage || `Supprimer ${selectedRows.length} ticket(s)`}
          </Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
}
