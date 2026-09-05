'use client';

import { Avatar, Button, Card, Table, Tooltip } from '@heroui-v3/react';
import { Check, X } from 'lucide-react';
import React from 'react';

import { useDemandeAssignationController } from '@/app/(protected)/delivery-men/(valided)/requests/useDemandeAssignationController';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { SearchField } from '@/components/commons/form/search-field';
import ValidateDialog from '@/components/commons/validate-dialog';
import { type DemandeAssignationVM, type Restaurant } from '@/types/models';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

interface DemandesPanelProps {
  demandes: DemandeAssignationVM[];
  restaurants: Restaurant[];
}

const DEMANDE_COLUMNS = [
  { name: 'Nom complet', uid: 'nom' },
  { name: 'Statut', uid: 'statut' },
  { name: 'Date', uid: 'date' },
  { name: '', uid: 'actions' },
];

/**
 * Les demandes d'assignation en attente.
 *
 * <p>Le refus était un `<button>` écrit à la main, rond, gris, sans libellé accessible,
 * qui virait au `bg-red-500` au survol — une teinte de la palette Tailwind, indifférente
 * au thème. C'est un `Button` de la bibliothèque, avec son intitulé en info-bulle.</p>
 */
export function DemandesPanel({ demandes, restaurants }: DemandesPanelProps) {
  const ctrl = useDemandeAssignationController(demandes);

  function renderCell(item: DemandeAssignationVM, columnKey: string) {
    switch (columnKey) {
      case 'actions': {
        const isRejected = item.statutDemandeAssignation === 'REJETER';
        return (
          <div className="flex items-center justify-end gap-2">
            {item.type === 'FREE' ? (
              <Button onPress={() => ctrl.accortder(item)} size="sm" variant="outline">
                <Check aria-hidden="true" className="size-3.5" />
                Accorder
              </Button>
            ) : (
              <Button onPress={() => ctrl.onOpenDialog(item)} size="sm" variant="primary">
                <Check aria-hidden="true" className="size-3.5" />
                Accepter
              </Button>
            )}
            <Tooltip>
              <Button
                aria-label={`Rejeter la demande de ${item.nomComplet}`}
                isDisabled={isRejected}
                isIconOnly
                onPress={() => ctrl.retirer(item.id)}
                size="sm"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
              <Tooltip.Content>
                {isRejected ? 'Demande déjà rejetée' : 'Rejeter la demande'}
              </Tooltip.Content>
            </Tooltip>
          </div>
        );
      }
      case 'date':
        return <span className="text-sm text-muted">{item.date}</span>;
      case 'nom':
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 shrink-0">
              {item.avatarUrl && (
                <Avatar.Image alt={item.nomComplet} src={createUrlFile(item.avatarUrl, 'backend')} />
              )}
              <Avatar.Fallback>{getInitials(item.nomComplet)}</Avatar.Fallback>
            </Avatar>
            <span className="font-medium capitalize">{item.nomComplet}</span>
          </div>
        );
      case 'statut':
        return ctrl.recupererStatut(item.statutDemandeAssignation);
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Demandes d&apos;assignation en cours ({ctrl.data?.length ?? 0})
        </h2>
        <SearchField onChange={ctrl.setSelectValue} searchKey={ctrl.selectValue} />
      </div>

      <Card>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Tableau des demandes" className="min-w-[40rem]">
                <Table.Header>
                  {DEMANDE_COLUMNS.map((col) => (
                    <Table.Column id={col.uid} isRowHeader={col.uid === 'nom'} key={col.uid}>
                      {col.name}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="py-8 text-center text-sm text-muted">Aucune demande à afficher.</p>
                  )}
                >
                  {(ctrl.data ?? []).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {DEMANDE_COLUMNS.map((col) => (
                        <Table.Cell key={col.uid}>
                          {renderCell(row, col.uid) as React.ReactNode}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      <ValidateDialog
        demandeAssignationId={ctrl.demandeAssignationId}
        isOpen={ctrl.isOpen}
        nomComplet={ctrl.nomComplet}
        onClose={ctrl.onCloseDialog}
        rejeter={ctrl.rejeter}
        restaurants={restaurants}
        setRestaurantId={ctrl.setRestaurantSelectId}
        valider={ctrl.valider}
      />
      <ConfirmDialog {...ctrl.confirm} />
    </div>
  );
}
