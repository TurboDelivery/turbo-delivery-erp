import { Chip } from '@heroui-v3/react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useChangeStatusMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { IEmployee } from '@/features/personnel/types/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import React from 'react';
import { useAbility } from '@/hooks/use-ability';

/**
 * Config du badge de statut employé — partagée par la colonne du tableau et la
 * carte mobile (zéro divergence d'affichage).
 */
/**
 * Le ton du statut d'un employé.
 *
 * <p>C'étaient trois badges PLEINS et saturés — vert `600`, jaune `500`, et pour
 * « Inactif » la couleur de MARQUE, `bg-primary`. Trois pastilles pleines par ligne sur
 * cinquante lignes, dont une qui empruntait le rouge de l'entreprise pour dire « ce
 * compte ne sert plus ». Un employé inactif n'est pas une alerte, c'est une absence
 * d'activité : le neutre le dit. Un congé, lui, se remarque — c'est une personne qu'on
 * ne peut pas affecter aujourd'hui.</p>
 */
export const getEmployeeStatutTon = (
  statut: IEmployee['statut'],
): 'danger' | 'default' | 'success' | 'warning' => {
  switch (statut) {
    case 'Actif':
      return 'success';
    case 'Congé':
      return 'warning';
    default:
      return 'default';
  }
};

/** La pastille de statut, montée une fois pour la colonne et pour la carte tactile. */
export const ChipStatutEmploye = ({ statut }: { statut: IEmployee['statut'] }) => (
  <Chip color={getEmployeeStatutTon(statut)} size="sm" variant="soft">
    <Chip.Label>{statut}</Chip.Label>
  </Chip>
);

// Composant mémorisé pour les actions
export const EmployeeActions = React.memo(
  ({
    employee,
    onEdit,
    onDeactivate,
    onRemove,
  }: {
    employee: IEmployee;
    onEdit: (employee: IEmployee) => void;
    onDeactivate: (employee: IEmployee) => void;
    onRemove: (employee: IEmployee) => void;
  }) => {
    const supprimerEmployeMutation = useSupprimerEmployeMutation();
    const changeStatusMutation = useChangeStatusMutation();
    const ability = useAbility();
    const canUpdate = ability.can('update', 'Personnel');
    const canDelete = ability.can('delete', 'Personnel');

    const handleEdit = () => {
      onEdit(employee);
    };

    const handleDeactivate = () => {
      const newStatus = employee.statut === 'Actif' ? 'Inactif' : 'Actif';

      // Utiliser la mutation changeStatus au lieu de modifierEmploye
      changeStatusMutation.mutate({
        id: employee.id,
        status: newStatus,
      });

      onDeactivate(employee);
    };

    const handleDeleteConfirm = () => {
      supprimerEmployeMutation.mutate(employee.id, {
        onSuccess: () => {
          onRemove(employee);
        },
        onError: (error) => {
          console.error('Erreur lors de la suppression:', error);
        },
      });
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdate && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex items-center w-full" onClick={handleEdit}>
                <span>Modifier</span>
              </div>
            </DropdownMenuItem>
          )}
          {canUpdate && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex items-center w-full" onClick={handleDeactivate}>
                <span>{employee.statut === 'Actif' ? 'Désactiver' : 'Activer'}</span>
                {changeStatusMutation.isPending && <span className="ml-2 text-xs text-muted">...</span>}
              </div>
            </DropdownMenuItem>
          )}
          {canDelete && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center w-full text-red-600 cursor-pointer">
                  <span>Supprimer</span>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer l&#39;employé <strong>{employee.name}</strong> ?
                    <br />
                    <br />
                    <div className="bg-surface-secondary rounded p-2 text-sm">
                      <p>
                        <strong>Email:</strong> {employee.email}
                      </p>
                      <p>
                        <strong>Poste:</strong> {employee.position}
                      </p>
                      <p>
                        <strong>Département:</strong> {employee.department}
                      </p>
                    </div>
                    <br />
                    Cette action est irréversible et supprimera définitivement toutes les données associées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700" disabled={supprimerEmployeMutation.isPending}>
                    {supprimerEmployeMutation.isPending ? 'Suppression...' : 'Supprimer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

EmployeeActions.displayName = 'EmployeeActions';

export const employeeColumns: ColumnDef<IEmployee>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Nom & Email',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted">{row.original.email}</div>
      </div>
    ),
    enableSorting: true,
  },
  {
    id: 'position',
    accessorKey: 'position',
    header: 'Poste',
    cell: ({ row }) => row.original.position,
    enableSorting: false,
  },
  {
    id: 'department',
    accessorKey: 'department',
    header: 'Département',
    cell: ({ row }) => row.original.department,
    enableSorting: false,
  },
  {
    id: 'salary',
    accessorKey: 'salary',
    header: 'Salaire',
    cell: ({ row }) => {
      const salary = row.original.salary;
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(salary);
    },
    enableSorting: true,
  },
  {
    id: 'statut',
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      return <ChipStatutEmploye statut={row.original.statut} />;
    },
    enableSorting: false,
  },
  {
    id: 'entryDate',
    accessorKey: 'entryDate',
    header: "Date d'entrée",
    cell: ({ row }) => {
      const date = new Date(row.original.entryDate);
      return format(date, 'dd/MM/yyyy');
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      // Accéder aux callbacks depuis le meta du tableau
      const meta = table.options.meta as any;

      return <EmployeeActions employee={row.original} onEdit={meta?.onEdit} onDeactivate={meta?.onDeactivate} onRemove={meta?.onRemove} />;
    },
    enableSorting: false,
  },
];
