'use client';

import { Badge } from '@heroui/react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { LeaveRequest, LeaveStats } from './types';

interface LeaveManagementProps {
  leaveRequests: LeaveRequest[];
  leaveStats: LeaveStats;
}

export function LeaveManagement({ leaveRequests, leaveStats }: LeaveManagementProps) {
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Suivi des Congés et Absences</h2>

      {/* Tableau de bord des congés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Employés en congé</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-orange-600">{leaveStats.currentlyOnLeave}</div>
            <p className="text-sm text-gray-500">Actuellement</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Jours pris ce mois</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-blue-600">{leaveStats.takenThisMonth}</div>
            <p className="text-sm text-gray-500">Cumul mensuel</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Congés terminés</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{leaveStats.completedLeaves}</div>
            <p className="text-sm text-gray-500">Ce trimestre</p>
          </CardBody>
        </Card>
      </div>

      {/* Historique détaillé */}
      <div>
        <h3 className="text-lg font-medium mb-4">Historique des absences</h3>
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
      </div>
    </div>
  );
}
