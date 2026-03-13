'use client';

import { Employee } from '@/features/personnel/types/types';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export const employeeColumns = [
  {
    accessorKey: 'name',
    header: 'Employé',
    cell: ({ row }: { row: { original: Employee } }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-gray-500">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'position',
    header: 'Fonction',
    cell: ({ row }: { row: { original: Employee } }) => (
      <span>{row.original.position}</span>
    ),
  },
  {
    accessorKey: 'department',
    header: 'Département',
    cell: ({ row }: { row: { original: Employee } }) => (
      <span>{row.original.department}</span>
    ),
  },
  {
    accessorKey: 'salary',
    header: 'Salaire',
    cell: ({ row }: { row: { original: Employee } }) => (
      <span>{row.original.salary.toLocaleString()} F</span>
    ),
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }: { row: { original: Employee } }) => {
      const getStatusClasses = (statut: Employee['statut']) => {
        return cn(
          'capitalize',
          statut === 'Actif' && 'bg-green-200 text-green-800',
          statut === 'Congé' && 'bg-yellow-200 text-yellow-800',
          statut === 'Inactif' && 'bg-red-200 text-red-800'
        );
      };

      return (
        <span 
          className={getStatusClasses(row.original.statut)}
          style={{
            backgroundColor: row.original.statut === 'Actif' ? 'bg-green-200 text-green-800' : 
                           row.original.statut === 'Congé' ? 'bg-yellow-200 text-yellow-800' : 
                           row.original.statut === 'Inactif' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            display: 'inline-block'
          }}
        >
          {row.original.statut}
        </span>
      );
    },
  },
  {
    accessorKey: 'entryDate',
    header: 'Date d\'entrée',
    cell: ({ row }: { row: { original: Employee } }) => (
      <span>{row.original.entryDate}</span>
    ),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }: { row: { original: Employee } }) => (
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly size="sm" variant="light">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem 
            key="edit"
            onPress={() => console.log('Edit employee:', row.original)}
          >
            Modifier le poste
          </DropdownItem>
          <DropdownItem 
            key="deactivate"
            onPress={() => console.log('Deactivate employee:', row.original)}
          >
            Désactiver
          </DropdownItem>
          <DropdownItem 
            key="remove"
            className="text-danger"
            onPress={() => console.log('Remove employee:', row.original)}
          >
            Retirer
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    ),
  },
];
