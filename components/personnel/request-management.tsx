'use client';

import { useState } from 'react';
import { RequestTable } from './request-table';
import AutomatisationConges from './automation-conges';
import PlanningConges from './planning-conges';
import { IEmployee, LeaveRequest, RequestStats } from '@/features/personnel/types/types';
import { eligibleEmployeeQuery } from '@/features/conge/queries/conge.query';
import { MaterialTabsList, MaterialTabsTrigger, Tabs, TabsContent } from '@/components/commons/tabs';

import { RequestHeader } from './request-header';
import { RequestStats as RequestStatsComponent } from './request-stats';
import { RequestForm } from './request-form';
import { ConfirmDialog, useConfirmDialog } from './confirm-dialog';
import { useRequestManagement } from '@/hooks/use-request-management';

interface RequestManagementProps {
  requests: LeaveRequest[];
  requestStats: RequestStats;
  employees: IEmployee[];
}

export function RequestManagement({ requests, employees }: RequestManagementProps) {
  // Récupérer la liste des employés éligibles depuis l'API
  const { data: employeesData } = eligibleEmployeeQuery({ limit: 1000 });
  console.log('Employés éligibles data:', employeesData);

  // Utiliser les données de l'API si disponibles, sinon les données mockées
  const displayEmployees = Array.isArray(employeesData) ? employeesData : employees;

  // Hook personnalisé pour la gestion des demandes
  const { isFormOpen, onOpenChange, isEditMode, editingRequestId, handleSubmitRequest, handleDeleteRequest, handleApproveRequest, handleRejectRequest, handleEditRequest, handleNewRequest } =
    useRequestManagement(displayEmployees);

  // Hook pour la modal de confirmation
  const { isOpen, onOpenChange: onConfirmDialogOpenChange, message, openDialog, confirm } = useConfirmDialog();

  // État pour la demande en cours d'édition
  const [editingRequest, setEditingRequest] = useState<Partial<LeaveRequest>>({});

  const handleDeleteWithConfirmation = (requestId: string) => {
    openDialog('Êtes-vous sûr de vouloir supprimer cette demande de congé ?', () => handleDeleteRequest(requestId));
  };

  const handleEditRequestWithForm = (request: LeaveRequest) => {
    setEditingRequest(request);
    handleEditRequest(request);
  };

  return (
    <div className="space-y-6">
      <RequestHeader onNewRequest={handleNewRequest} />

      {/* Statistiques de traitement */}
      <RequestStatsComponent />
      <div className=" flex justify-end">
        <Tabs defaultValue="conge" className="w-full">
          <MaterialTabsList className="grid max-w-2xl grid-cols-4 rounded-full">
            <MaterialTabsTrigger value="conge">Congé</MaterialTabsTrigger>
            <MaterialTabsTrigger value="employe">Employé</MaterialTabsTrigger>
            <MaterialTabsTrigger value="planning-calendrier">Planning Calendrier</MaterialTabsTrigger>
          </MaterialTabsList>

          <TabsContent value="conge" className="mt-6">
            {/* Tableau des demandes */}
            <RequestTable
              requests={requests}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              onDeleteRequest={handleDeleteWithConfirmation}
              onEditRequest={handleEditRequestWithForm}
            />
          </TabsContent>
          <TabsContent value="employe" className="mt-6">
            <AutomatisationConges />
          </TabsContent>
          <TabsContent value="planning-calendrier" className="mt-6">
            <PlanningConges />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal nouvelle demande */}
      <RequestForm
        isOpen={isFormOpen}
        onOpenChange={onOpenChange}
        isEditMode={isEditMode}
        editingRequestId={editingRequestId}
        employees={displayEmployees}
        initialRequest={editingRequest}
        onSubmit={handleSubmitRequest}
        onCancel={() => onOpenChange(false)}
      />

      {/* Modal de confirmation */}
      <ConfirmDialog message={message} onConfirm={confirm} isOpen={isOpen} onOpenChange={onConfirmDialogOpenChange} />
    </div>
  );
}
