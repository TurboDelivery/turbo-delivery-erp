'use client';

import { Deduction } from '@/features/personnel/types/types';
import { Badge } from '@heroui/react';

export const deductionColumns = [
  {
    accessorKey: 'employeeName',
    header: 'Employé',
    cell: ({ row }: { row: { original: Deduction } }) => (
      <div className="font-medium">{row.original.employeeName}</div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type de déduction',
    cell: ({ row }: { row: { original: Deduction } }) => {
      const getTypeColor = (type: Deduction['type']) => {
        switch (type) {
          case 'Retard': return 'warning';
          case 'Absence injustifiée': return 'danger';
          case 'Dommage matériel': return 'secondary';
          case 'Avance sur salaire': return 'primary';
          default: return 'default';
        }
      };

      return (
        <Badge 
          color={getTypeColor(row.original.type)} 
          variant="flat"
          className="capitalize"
        >
          {row.original.type}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Montant',
    cell: ({ row }: { row: { original: Deduction } }) => (
      <span>{row.original.amount.toLocaleString()} F</span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }: { row: { original: Deduction } }) => (
      <span>{row.original.date}</span>
    ),
  },
  {
    accessorKey: 'reason',
    header: 'Motif',
    cell: ({ row }: { row: { original: Deduction } }) => (
      <div className="max-w-xs truncate" title={row.original.reason}>
        {row.original.reason}
      </div>
    ),
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }: { row: { original: Deduction } }) => {
      const getStatusColor = (statut: Deduction['statut']) => {
        switch (statut) {
          case 'Appliquée': return 'success';
          case 'En attente': return 'warning';
          default: return 'default';
        }
      };

      return (
        <Badge color={getStatusColor(row.original.statut)} variant="flat">
          {row.original.statut}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'repaymentDuration',
    header: 'Durée de remboursement',
    cell: ({ row }: { row: { original: Deduction } }) => (
      <span>
        {row.original.repaymentDuration ? `${row.original.repaymentDuration} mois` : '-'}
      </span>
    ),
  },
];
