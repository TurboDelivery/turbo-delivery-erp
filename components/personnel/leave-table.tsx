'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { MoreVertical } from 'lucide-react';
import { LeaveRequest } from '../../features/personnel/types/types';
import { cn } from '@/lib/utils';

interface LeaveTableProps {
  leaveRequests: LeaveRequest[];
}

export function LeaveTable({ leaveRequests }: LeaveTableProps) {
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);

  const getStatusColor = (statut: LeaveRequest['statut']) => {
    switch (statut) {
      case 'En cours': return 'secondary';
      case 'Terminé': return 'default';
      case 'En attente': return 'outline';
      case 'Approuvée': return 'default';
      case 'Rejetée': return 'destructive';
      default: return 'outline';
    }
  };

  const getLeaveTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'annuel': return 'default';
      case 'maladie': return 'destructive';
      case 'sans solde': return 'secondary';
      default: return 'outline';
    }
  };

  const getLeaveTypeLabel = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'annuel': return 'Congé annuel';
      case 'maladie': return 'Congé maladie';
      case 'sans solde': return 'Congé sans solde';
      default: return type;
    }
  };

  const getEmployeeInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const calculateElapsedTime = (startDate: string, endDate: string, statut: LeaveRequest['statut']) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (statut === 'Terminé') {
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${totalDays} jours plein`;
    }

    if (statut === 'En cours') {
      const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${elapsedDays} jours écoulés`;
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${totalDays} jours plein`;
  };

  const handleAction = (action: string, leaveId: string) => {
    console.log(`Action: ${action} for leave: ${leaveId}`);
    // Implémenter les actions ici
  };

  return (
    <Table aria-label="Historique des congés">
      <TableHeader>
        <TableColumn>Employé</TableColumn>
        <TableColumn>Type de congé</TableColumn>
        <TableColumn>Date de début</TableColumn>
        <TableColumn>Date de fin</TableColumn>
        <TableColumn>Durée</TableColumn>
        <TableColumn>Temps écoulé</TableColumn>
        <TableColumn>Statut</TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {leaveRequests.map((leave) => (
          <TableRow key={leave.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {getEmployeeInitials(leave.employeeName)}
                </div>
                <div className="font-medium">{leave.employeeName}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                leave.type === 'annuel' ? 'bg-blue-600 text-white border-blue-300' :
                leave.type === 'maladie' ? 'bg-red-600 text-white border-red-300' :
                leave.type === 'sans solde' ? 'bg-yellow-500 text-white border-yellow-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {getLeaveTypeLabel(leave.type)}
              </div>
            </TableCell>
            <TableCell>{leave.startDate}</TableCell>
            <TableCell>{leave.endDate}</TableCell>
            <TableCell>{leave.duration} jours</TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">
                {calculateElapsedTime(leave.startDate, leave.endDate, leave.statut)}
              </span>
            </TableCell>
            <TableCell>
              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                leave.statut === 'En cours' ? 'bg-yellow-500 text-white border-yellow-200' :
                leave.statut === 'Terminé' ? 'bg-green-600 text-white border-green-300' :
                leave.statut === 'En attente' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                leave.statut === 'Approuvée' ? 'bg-green-600 text-white border-green-300' :
                leave.statut === 'Rejetée' ? 'bg-red-600 text-white border-red-300' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {leave.statut}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setSelectedLeave(leave.id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => handleAction('extend', leave.id)}
                  >
                    Prolonger la période
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAction('complete', leave.id)}
                  >
                    Marqué comme Terminé
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAction('suspend', leave.id)}
                    className="text-red-600"
                  >
                    Suspendre
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
