'use client';

import React from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Check, X } from 'lucide-react';
import { SearchField } from '@/components/commons/form/search-field';
import { createUrlFile } from '@/utils/createUrlFile';
import { type DemandeAssignationVM, type Restaurant } from '@/types/models';
import { useDemandeAssignationController } from '@/app/(protected)/delivery-men/(valided)/requests/useDemandeAssignationController';
import ValidateDialog from '@/components/commons/validate-dialog';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';

interface DemandesPanelProps {
  demandes: DemandeAssignationVM[];
  restaurants: Restaurant[];
}

const DEMANDE_COLUMNS = [
  { uid: 'nom', name: 'Nom complet' },
  { uid: 'statut', name: 'Statut' },
  { uid: 'date', name: 'Date' },
  { uid: 'actions', name: 'Actions' },
];

export function DemandesPanel({ demandes, restaurants }: DemandesPanelProps) {
  const ctrl = useDemandeAssignationController(demandes);

  function renderCell(item: DemandeAssignationVM, columnKey: string) {
    switch (columnKey) {
      case 'nom':
        return (
          <div className="flex items-center gap-3">
            <img
              src={item.avatarUrl ? createUrlFile(item.avatarUrl, 'backend') : '/assets/images/avatar.png'}
              alt={item.nomComplet}
              className="w-8 h-8 rounded-full object-cover shadow-sm"
            />
            <span className="font-medium capitalize">{item.nomComplet}</span>
          </div>
        );
      case 'statut':
        return ctrl.recupererStatut(item.statutDemandeAssignation);
      case 'date':
        return <span className="text-sm text-gray-500">{item.date}</span>;
      case 'actions': {
        const isRejected = item.statutDemandeAssignation === 'REJETER';
        return (
          <div className="flex items-center gap-2">
            {item.type === 'FREE' ? (
              <Button
                size="sm"
                color="warning"
                variant="flat"
                onPress={() => ctrl.accortder(item)}
                startContent={<Check className="w-3.5 h-3.5" />}
              >
                Accorder
              </Button>
            ) : (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => ctrl.onOpenDialog(item)}
                startContent={<Check className="w-3.5 h-3.5" />}
              >
                Accepter
              </Button>
            )}
            <button
              type="button"
              disabled={isRejected}
              onClick={() => !isRejected && ctrl.retirer(item.id)}
              className={`p-1.5 rounded-full text-white transition-colors ${
                isRejected
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-400 hover:bg-red-500 cursor-pointer'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">
          Demandes d'assignation en cours ({ctrl.data?.length ?? 0})
        </h2>
        <SearchField searchKey={ctrl.selectValue} onChange={ctrl.setSelectValue} />
      </div>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Table
          aria-label="Tableau des demandes"
          removeWrapper
          classNames={{ th: 'bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide', td: 'py-3' }}
        >
          <TableHeader>
            {DEMANDE_COLUMNS.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucune demande à afficher.">
            {(ctrl.data ?? []).map((row) => (
              <TableRow key={row.id}>
                {DEMANDE_COLUMNS.map((col) => (
                  <TableCell key={col.uid}>{renderCell(row, col.uid) as React.ReactNode}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ValidateDialog
        restaurants={restaurants}
        isOpen={ctrl.isOpen}
        onClose={ctrl.onCloseDialog}
        nomComplet={ctrl.nomComplet}
        setRestaurantId={ctrl.setRestaurantSelectId}
        valider={ctrl.valider}
        rejeter={ctrl.rejeter}
        demandeAssignationId={ctrl.demandeAssignationId}
      />
      <ConfirmDialog {...ctrl.confirm} />
    </div>
  );
}
