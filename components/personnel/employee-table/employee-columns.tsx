import { Badge } from '@/components/ui/badge';
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
import { useModifierEmployeMutation, useSupprimerEmployeMutation, useChangeStatusMutation } from '@/features/personnel/mutations/employee.mutation';
import { Employee } from '@/features/personnel/types/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import React from 'react';

// Composant mémorisé pour les actions
const EmployeeActions = React.memo(({ 
  employee, 
  onEdit, 
  onDeactivate, 
  onRemove 
}: { 
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onRemove: (employee: Employee) => void;
}) => {
  const modifierEmployeMutation = useModifierEmployeMutation();
  const supprimerEmployeMutation = useSupprimerEmployeMutation();
  const changeStatusMutation = useChangeStatusMutation();

  const handleEdit = () => {
    onEdit(employee);
  };

  const handleDeactivate = () => {
    const newStatus = employee.statut === 'Actif' ? 'Inactif' : 'Actif';
    
    // Utiliser la mutation changeStatus au lieu de modifierEmploye
    changeStatusMutation.mutate({
      id: employee.id,
      status: newStatus
    });
    
    onDeactivate(employee);
  };

  const handleRemove = () => {
    // La suppression sera gérée par l'AlertDialog
  };

  const handleDeleteConfirm = () => {
    supprimerEmployeMutation.mutate(employee.id, {
      onSuccess: () => {
        onRemove(employee);
      },
      onError: (error) => {
        console.error('Erreur lors de la suppression:', error);
      }
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div 
            className="flex items-center w-full"
            onClick={handleEdit}
          >
            <span>Modifier</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div 
            className="flex items-center w-full"
            onClick={handleDeactivate}
          >
            <span>{employee.statut === 'Actif' ? 'Désactiver' : 'Activer'}</span>
            {changeStatusMutation.isPending && (
              <span className="ml-2 text-xs text-gray-500">...</span>
            )}
          </div>
        </DropdownMenuItem>
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
                  Êtes-vous sûr de vouloir supprimer l'employé <strong>{employee.name}</strong> ?
                  <br /><br />
                  <div className="bg-gray-50 rounded p-2 text-sm">
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Poste:</strong> {employee.position}</p>
                    <p><strong>Département:</strong> {employee.department}</p>
                  </div>
                  <br />
                  Cette action est irréversible et supprimera définitivement toutes les données associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={supprimerEmployeMutation.isPending}
                >
                  {supprimerEmployeMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

EmployeeActions.displayName = 'EmployeeActions';

export const employeeColumns: ColumnDef<Employee>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Nom & Email',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-gray-500">{row.original.email}</div>
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
        maximumFractionDigits: 0
      }).format(salary);
    },
    enableSorting: true,
  },
  {
    id: 'statut',
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const statut = row.original.statut;
      let badgeClass = '';
      let label = statut;

      switch (statut) {
        case 'Actif':
          badgeClass = 'bg-green-600 text-white border-green-300';
          break;
        case 'Inactif':
          badgeClass = 'bg-primary text-white border-primary';
          break;
        case 'Congé':
          badgeClass = 'bg-yellow-500 text-white border-yellow-200';
          break;
        default:
          badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
      }

      return (
        <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {label}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: 'entryDate',
    accessorKey: 'entryDate',
    header: 'Date d\'entrée',
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
      
      return (
        <EmployeeActions 
          employee={row.original}
          onEdit={meta?.onEdit}
          onDeactivate={meta?.onDeactivate}
          onRemove={meta?.onRemove}
        />
      );
    },
    enableSorting: false,
  },
];
