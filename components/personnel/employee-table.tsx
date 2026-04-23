'use client';

import React, { useState } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { IEmployee } from '@/features/personnel/types/types';
import { cn } from '@/lib/utils';
import { useModifierEmployeMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations';
import { EditEmployeeModal } from './edit-employee-modal';
import { MoreVertical } from 'lucide-react';

interface EmployeeTableProps {
  employees: IEmployee[];
}

const columnHelper = createColumnHelper<IEmployee>();

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);

  const modifierEmployeMutation = useModifierEmployeMutation();
  const supprimerEmployeMutation = useSupprimerEmployeMutation();

  const handleEdit = (employee: IEmployee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDelete = (employee: IEmployee) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.name} ?`)) {
      supprimerEmployeMutation.mutate(employee.id);
    }
  };

  const handleDeactivate = (employee: IEmployee) => {
    modifierEmployeMutation.mutate({
      id: employee.id,
      data: {
        ...employee,
        statut: employee.statut === 'Actif' ? 'Inactif' : 'Actif',
      },
    });
  };

  const getStatusClasses = (statut: IEmployee['statut']) => {
    switch (statut) {
      case 'Actif':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium';
      case 'Inactif':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium';
      case 'Congé':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  const columns = [
    columnHelper.accessor('name', {
      header: 'NOM',
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'EMAIL',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('position', {
      header: 'POSTE',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('department', {
      header: 'DÉPARTEMENT',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('salary', {
      header: 'SALAIRE',
      cell: (info) => `${info.getValue().toLocaleString()} F`,
    }),
    columnHelper.accessor('statut', {
      header: 'STATUT',
      cell: (info) => (
        <span
          className={cn(getStatusClasses(info.getValue()))}
          style={{
            backgroundColor: info.getValue() === 'Actif' ? '#dcfce7' : info.getValue() === 'Inactif' ? '#fee2e2' : info.getValue() === 'Congé' ? '#fef3c7' : '#f3f4f6',
            color: info.getValue() === 'Actif' ? '#166534' : info.getValue() === 'Inactif' ? '#991b1b' : info.getValue() === 'Congé' ? '#a16207' : '#374151',
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: (info) => (
        <div className="relative flex justify-center">
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="text-gray-500">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="edit" onPress={() => handleEdit(info.row.original)}>
                Modifier
              </DropdownItem>
              <DropdownItem key="deactivate" onPress={() => handleDeactivate(info.row.original)}>
                {info.row.original.statut === 'Actif' ? 'Désactiver' : 'Activer'}
              </DropdownItem>
              <DropdownItem key="delete" className="text-danger" onPress={() => handleDelete(info.row.original)}>
                Supprimer
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border bg-white">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />
    </>
  );
}
