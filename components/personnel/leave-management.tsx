'use client';

import { Badge } from '@heroui/react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { LeaveTable } from './leave-table';
import { LeaveRequest, LeaveStats } from '../../features/personnel/types/types';

interface LeaveManagementProps {
  leaveRequests: LeaveRequest[];
  leaveStats: LeaveStats;
}

export function LeaveManagement({ leaveRequests, leaveStats }: LeaveManagementProps) {
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
        <LeaveTable leaveRequests={leaveRequests} />
      </div>
    </div>
  );
}
