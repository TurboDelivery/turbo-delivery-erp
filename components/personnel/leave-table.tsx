'use client';

import { Badge } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { LeaveRequest } from '../../features/personnel/types/types';
import { cn } from '@/lib/utils';

interface LeaveTableProps {
  leaveRequests: LeaveRequest[];
}

export function LeaveTable({ leaveRequests }: LeaveTableProps) {
  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'En cours': return 'warning';
      case 'Terminé': return 'success';
      case 'En attente': return 'default';
      default: return 'default';
    }
  };

  const getLeaveTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'annuel': return 'primary';
      case 'maladie': return 'danger';
      case 'sans solde': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Table aria-label="Historique des congés">
      <TableHeader>
        <TableColumn>Employé</TableColumn>
        <TableColumn>Type de congé</TableColumn>
        <TableColumn>Date de début</TableColumn>
        <TableColumn>Date de fin</TableColumn>
        <TableColumn>Durée</TableColumn>
        <TableColumn>Statut</TableColumn>
        <TableColumn>Motif</TableColumn>
      </TableHeader>
      <TableBody>
        {leaveRequests.map((leave) => (
          <TableRow key={leave.id}>
            <TableCell>
              <div>
                <div className="font-medium">{leave.employeeName}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                color={getLeaveTypeColor(leave.type)} 
                variant="flat"
                className="capitalize"
              >
                {leave.type}
              </Badge>
            </TableCell>
            <TableCell>{leave.startDate}</TableCell>
            <TableCell>{leave.endDate}</TableCell>
            <TableCell>{leave.duration} jours</TableCell>
            <TableCell>
              <Badge 
                color={getStatusColor(leave.status)} 
                variant="flat"
              >
                {leave.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="max-w-xs truncate" title={leave.reason}>
                {leave.reason || '-'}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
