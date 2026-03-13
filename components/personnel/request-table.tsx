'use client';

import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { LeaveRequest } from '../../features/personnel/types/types';

interface RequestTableProps {
  requests: LeaveRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
}

export function RequestTable({ requests, onApproveRequest, onRejectRequest }: RequestTableProps) {
  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'En attente': return 'warning';
      case 'Approuvée': return 'success';
      case 'Rejetée': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Table aria-label="Liste des demandes">
      <TableHeader>
        <TableColumn>Employé</TableColumn>
        <TableColumn>Type de congé</TableColumn>
        <TableColumn>Dates</TableColumn>
        <TableColumn>Durée</TableColumn>
        <TableColumn>Motif</TableColumn>
        <TableColumn>Statut</TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="font-medium">{request.employeeName}</div>
            </TableCell>
            <TableCell>
              <Badge color="primary" variant="flat" className="capitalize">
                {request.type}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>Du: {request.startDate}</div>
                <div>Au: {request.endDate}</div>
              </div>
            </TableCell>
            <TableCell>{request.duration} jours</TableCell>
            <TableCell>
              <div className="max-w-xs truncate" title={request.reason}>
                {request.reason}
              </div>
            </TableCell>
            <TableCell>
              <Badge color={getStatusColor(request.status)} variant="flat">
                {request.status}
              </Badge>
            </TableCell>
            <TableCell>
              {request.status === 'En attente' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    color="success" 
                    variant="flat"
                    onPress={() => onApproveRequest(request.id)}
                  >
                    Approuver
                  </Button>
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="flat"
                    onPress={() => onRejectRequest(request.id)}
                  >
                    Rejeter
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
