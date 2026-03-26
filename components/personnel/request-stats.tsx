'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { useStatistiquesCongesQuery } from '@/features/conge/queries/conge.query';

export function RequestStats() {
  const { data: statsData, isLoading: statsLoading } = useStatistiquesCongesQuery();
  console.log('statistique data', statsData);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Statistiques globales des congés</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-600">Actuellement en congé</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-blue-600">{statsLoading ? '...' : statsData?.currentlyOnLeave || 0}</div>
            <p className="text-sm text-gray-500">Employés en congé</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-600">Pris ce mois</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{statsLoading ? '...' : statsData?.takenThisMonth || 0}</div>
            <p className="text-sm text-gray-500">Congés ce mois</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-600">Congés terminés</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-gray-600">{statsLoading ? '...' : statsData?.completedLeaves || 0}</div>
            <p className="text-sm text-gray-500">Congés achevés</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-600">Demandes en attente</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-yellow-600">{statsLoading ? '...' : statsData?.pendingRequests || 0}</div>
            <p className="text-sm text-gray-500">En attente de validation</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-600">Demandes approuvées</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{statsLoading ? '...' : statsData?.approvedRequests || 0}</div>
            <p className="text-sm text-gray-500">Validées</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-600">Demandes rejetées</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-red-600">{statsLoading ? '...' : statsData?.rejectedRequests || 0}</div>
            <p className="text-sm text-gray-500">Refusées</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
