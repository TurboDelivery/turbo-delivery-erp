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
  const getStatusColor = (statut: LeaveRequest['statut']) => {
    switch (statut) {
      case 'En attente': return 'warning';
      case 'Approuvée': return 'success';
      case 'Rejetée': return 'danger';
      default: return 'default';
    }
  };

  const getEmployeeInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getLeaveTypeLabel = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'annuel': return 'Congé annuel';
      case 'maladie': return 'Congé maladie';
      case 'sans solde': return 'Congé sans solde';
      default: return type;
    }
  };

  return (
    <Table aria-label="Liste des demandes">
      <TableHeader>
        <TableColumn>EMPLOYÉ</TableColumn>
        <TableColumn>TYPE</TableColumn>
        <TableColumn>PÉRIODE</TableColumn>
        <TableColumn>DURÉE</TableColumn>
        <TableColumn>MOTIF</TableColumn>
        <TableColumn>STATUT</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {getEmployeeInitials(request.employeeName)}
                </div>
                <div>
                  <div className="font-medium">{request.employeeName}</div>
                  <div className="text-sm text-gray-500">Demande créée le {new Date(request.createdAt || request.startDate).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                request.type === 'annuel' ? 'bg-blue-600 text-white border-blue-300' :
                request.type === 'maladie' ? 'bg-red-600 text-white border-red-300' :
                request.type === 'sans solde' ? 'bg-yellow-500 text-white border-yellow-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {getLeaveTypeLabel(request.type)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{request.startDate}</div>
                <div>{request.endDate}</div>
              </div>
            </TableCell>
            <TableCell>{request.duration} jours</TableCell>
            <TableCell>
              <div className="max-w-xs truncate" title={request.reason}>
                {request.reason}
              </div>
            </TableCell>
            <TableCell>
              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                request.statut === 'En attente' ? 'bg-yellow-500 text-white border-yellow-200' :
                request.statut === 'Approuvée' ? 'bg-green-600 text-white border-green-300' :
                request.statut === 'Rejetée' ? 'bg-red-600 text-white border-red-300' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {request.statut}
              </div>
            </TableCell>
            <TableCell>
              {request.statut === 'En attente' && (
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
              {request.statut === 'Approuvée' && (
                <Button 
                  size="sm" 
                  color="default" 
                  variant="flat"
                >
                  Activer
                </Button>
              )}
              {request.statut === 'Rejetée' && (
                <Button 
                  size="sm" 
                  color="default" 
                  variant="flat"
                >
                  Attente
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
