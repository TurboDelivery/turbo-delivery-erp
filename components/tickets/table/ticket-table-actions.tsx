'use client';

import React from 'react';
import { Button,
Spinner, Tooltip } from '@heroui-v3/react';
import { ShieldCheck, Trash } from 'lucide-react';

import { Ticket } from '@/types/bon-livraison.model';

interface TicketTableActionsProps {
  ticketsData: Ticket[];
  selectedRows: string[];
  permissions: { canDelete: boolean; canAuthentifier: boolean };
  isDeletingBonLivraison: boolean;
  onDeleteRows: () => void;
  /**
   * Les lignes selectionnees QUE L'ON PEUT authentifier, c'est-a-dire PENDING ou
   * TARDIF. Distinct de `selectedRows` a dessein : un REJETE_FRAUDE se supprime mais
   * ne s'authentifie pas, et annoncer un nombre que le serveur refusera ensuite fait
   * croire a une panne.
   */
  selectedRowsAAuthentifier: string[];
  isAuthentifying: boolean;
  onAuthentifierRows: () => void;
}

export function TicketTableActions({
  selectedRows,
  permissions,
  isDeletingBonLivraison,
  onDeleteRows,
  selectedRowsAAuthentifier,
  isAuthentifying,
  onAuthentifierRows,
}: TicketTableActionsProps) {
  // Trois causes grisent ce bouton sans qu'aucune ne soit nommee : on annonce celle qui bloque
  // vraiment, le droit d'abord. La suppression en cours se signale deja par son spinner, elle
  // n'a donc pas de motif et laisse le Tooltip ferme.
  const motifBlocage = !permissions.canDelete
    ? 'Votre rôle ne permet pas de supprimer un ticket'
    : selectedRows.length === 0
      ? 'Sélectionnez au moins une ligne à supprimer'
      : '';

  /*
   * Le motif de blocage de l'authentification distingue DEUX cas que le bouton grise
   * de la meme facon : rien de selectionne, et une selection dont aucune ligne n'est
   * authentifiable. Le second est le plus deroutant — l'operateur a bien coche des
   * lignes et le bouton reste eteint.
   */
  const motifBlocageAuth = !permissions.canAuthentifier
    ? 'Votre rôle ne permet pas d’authentifier un ticket'
    : selectedRows.length === 0
      ? 'Sélectionnez au moins une ligne à authentifier'
      : selectedRowsAAuthentifier.length === 0
        ? 'Aucune ligne sélectionnée n’est authentifiable : seuls les tickets en attente ou tardifs le sont'
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
            {selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}
          </Button>
          <Tooltip.Content>
            {motifBlocage || `Supprimer ${selectedRows.length} ticket(s)`}
          </Tooltip.Content>
        </Tooltip>

        {/*
          `outline` et NON `primary` : le primaire de cet ERP est rouge, et deux boutons
          rouges cote a cote dont l'un supprime definitivement et l'autre fait avancer la
          chaine de controle se ressemblent trop. C'est aussi la variante que porte deja
          « Tout valider V1 », l'autre action groupee de la chaine.

          Le NOMBRE est dans le libelle, pas seulement dans l'info-bulle : c'est ce que
          l'operateur doit lire AVANT de cliquer, et une info-bulle ne s'ouvre qu'au
          survol — jamais au doigt sur une tablette.
        */}
        <Tooltip>
          <Button
            isDisabled={
              !permissions.canAuthentifier
              || selectedRowsAAuthentifier.length === 0
              || isAuthentifying
            }
            isPending={isAuthentifying}
            onPress={onAuthentifierRows}
            variant="outline"
          >
            {isAuthentifying
              ? <Spinner color="current" size="sm" />
              : <ShieldCheck aria-hidden="true" className="size-4" />}
            Authentifier
            {selectedRowsAAuthentifier.length > 0
              ? ` (${selectedRowsAAuthentifier.length})`
              : ''}
          </Button>
          <Tooltip.Content>
            {motifBlocageAuth
              || `Authentifier ${selectedRowsAAuthentifier.length} ticket(s)`}
          </Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
}
