'use client';
import React from 'react';
import { Check, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { DemandeAssignationVM, Restaurant } from '@/types/models';
import ValidateDialog from '@/components/commons/validate-dialog';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { SearchField } from '@/components/commons/form/search-field';
import { useDemandeAssignationController } from './useDemandeAssignationController';
import { createUrlFile } from '@/utils/createUrlFile';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

export default function Content({ demandeAssignations, allRestaurant }: { demandeAssignations: DemandeAssignationVM[]; allRestaurant: Restaurant[] }) {
  const demandeCtrl = useDemandeAssignationController(demandeAssignations);
  const rows = demandeCtrl.data || [];
  // Colonnes
  const demandeColumns = [
    { uid: 'nom', name: 'Nom complet' },
    { uid: 'statut', name: 'Statut' },
    { uid: 'date', name: 'Date' },
    { uid: 'actions', name: 'Actions' },
  ];

  // Rendu dynamique des cellules
  const renderDemandeCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nom':
        return (
          <div className="flex items-center gap-4">
            <img src={item.avatarUrl ? createUrlFile(item.avatarUrl, 'backend') : '/assets/images/avatar.png'} alt={item?.nomComplet} className="w-8 h-8 rounded-full object-cover mr-3 shadow-md" />
            <div className="font-medium capitalize">{item?.nomComplet}</div>
          </div>
        );

      case 'statut':
        return demandeCtrl.recupererStatut(item.statutDemandeAssignation);

      case 'date':
        return item.date;

      case 'actions':
        const isRejected = item.statutDemandeAssignation === 'REJETER';

        return (
          <div className="flex gap-4 items-center">
            {item.type === 'FREE' ? (
              <Button onClick={() => demandeCtrl.accortder(item)} className="h-8 bg-orange-500">
                <span className="flex gap-2">
                  <Check size={15} /> Accorder
                </span>
              </Button>
            ) : (
              <Button onClick={() => demandeCtrl.onOpenDialog(item)} className="h-7">
                <span className="flex gap-2 items-center">
                  <Check size={15} /> Accepter
                </span>
              </Button>
            )}

            <span
              className={`text-white p-1 bg-gray-400 rounded-full hover:bg-primary ${isRejected ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
              onClick={() => !isRejected && demandeCtrl.retirer(item.id)}
            >
              <XIcon className="h-5 w-5" />
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 pt-0 flex-wrap">
      <SearchField searchKey={demandeCtrl.selectValue} onChange={demandeCtrl.setSelectValue} />

      <div className="bg-white rounded-lg overflow-x-auto lg:overflow-hidden xl:overflow-hidden md:overflow-x-auto ms:overflow-x-auto">
        <div className="bg-white rounded-lg overflow-x-auto py-4 shadow">
          {rows.length === 0 ? (
            <div className="text-center mt-10 text-xl text-primary font-bold">
              <EmptyDataTable title="Aucun Résultat" />
            </div>
          ) : (
            <Table aria-label="Tableau des demandes d’assignation">
              <TableHeader>
                {demandeColumns.map((col) => (
                  <TableColumn key={col.uid}>{col.name}</TableColumn>
                ))}
              </TableHeader>
              <TableBody emptyContent="Aucune demande à afficher.">
                {rows.map((row: any) => (
                  <TableRow key={row.id}>
                    {demandeColumns.map((col) => (
                      <TableCell key={col.uid}>{renderDemandeCell(row, col.uid)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <ValidateDialog
          restaurants={allRestaurant}
          isOpen={demandeCtrl.isOpen}
          onClose={demandeCtrl.onCloseDialog}
          nomComplet={demandeCtrl.nomComplet}
          setRestaurantId={demandeCtrl.setRestaurantSelectId}
          valider={demandeCtrl.valider}
          rejeter={demandeCtrl.rejeter}
          demandeAssignationId={demandeCtrl.demandeAssignationId}
        />
      </div>
      <ConfirmDialog {...demandeCtrl.confirm} />
    </div>
  );
}
