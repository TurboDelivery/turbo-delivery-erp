'use client';

import { LeaveRequest } from '@/features/personnel/types/types';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';

export const leaveRequestColumns = [
  {
    accessorKey: 'employeeName',
    header: 'Employé',
    cell: ({ row }: { row: { original: LeaveRequest } }) => (
      <div className="font-medium">{row.original.employeeName}</div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type de congé',
    cell: ({ row }: { row: { original: LeaveRequest } }) => (
      <Badge color="primary" variant="flat" className="capitalize">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: 'dates',
    header: 'Dates',
    cell: ({ row }: { row: { original: LeaveRequest } }) => (
      <div className="text-sm">
        <div>Du: {row.original.startDate}</div>
        <div>Au: {row.original.endDate}</div>
      </div>
    ),
  },
  {
    accessorKey: 'duration',
    header: 'Durée',
    cell: ({ row }: { row: { original: LeaveRequest } }) => (
      <span>{row.original.duration} jours</span>
    ),
  },
  {
    accessorKey: 'reason',
    header: 'Motif',
    cell: ({ row }: { row: { original: LeaveRequest } }) => (
      <div className="max-w-xs truncate" title={row.original.reason}>
        {row.original.reason}
      </div>
    ),
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }: { row: { original: LeaveRequest } }) => {
      const getStatusColor = (statut: LeaveRequest['statut']) => {
        switch (statut) {
          case 'En attente': return 'warning';
          case 'Approuvée': return 'success';
          case 'Rejetée': return 'danger';
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
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }: { row: { original: LeaveRequest } }) => (
      <>
        {row.original.statut === 'En attente' && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              color="success" 
              variant="flat"
              onPress={() => console.log('Approve request:', row.original.id)}
            >
              Approuver
            </Button>
            <Button 
              size="sm" 
              color="danger" 
              variant="flat"
              onPress={() => console.log('Reject request:', row.original.id)}
            >
              Rejeter
            </Button>
          </div>
        )}
      </>
    ),
  },
];
