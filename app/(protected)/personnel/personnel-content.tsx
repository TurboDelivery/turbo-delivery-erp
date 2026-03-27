'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';

import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { EditEmployeeModal } from '@/components/personnel/edit-employee-modal';
import { RequestManagement } from '@/components/personnel/request-management';
import { IEmployee, LeaveRequest, RequestStats } from '@/features/personnel/types/types';
import { useAjouterEmployeMutation, useModifierEmployeMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { EmployeeTableNew } from '@/components/personnel/employee-table/index';
import { EmployeeCreateDTO } from '@/features/personnel/schemas/employee.schema';
import DeductionTabContents from '@/components/personnel/deductions/deduction-tab-contents';
 import PayrollTable from '@/components/personnel/payroll/table/payroll-table';

export default function PersonnelContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);

  const ajouterEmployeMutation = useAjouterEmployeMutation();
  const modifierEmployeMutation = useModifierEmployeMutation();
  const supprimerEmployeMutation = useSupprimerEmployeMutation();

  // Utiliser le hook pour récupérer tous les congés

  // Données de départements et positions
  const departments = [
    { id: '1', name: 'RESSOURCES HUMAINES' },
    { id: '2', name: 'COMMUNICATION - MARKETING' },
    { id: '3', name: 'DEVELOPPEMENT' },
    { id: '4', name: 'COMMERCIAL' },
    { id: '5', name: 'OPERATIONS' },
    { id: '6', name: 'DIRECTION' },
    { id: '7', name: 'TECHNIQUE' },
    { id: '8', name: 'LOGISTIQUE' },
    { id: '9', name: 'INFORMATIQUE' },
  ];

  const postes = [
    'DIRECTEUR GENERAL',
    'DIRECTEUR GENERAL ADJOINT',
    'RESPONSABLE DES OPERATIONS',
    'RESPONSABLE COMPTABLE',
    'RESPONSABLE DES RECOUVREMENTS',
    'CHEF AUX OPERATIONS',
    'STANDARDISTE',
    "AGENT DE LA CENTRALE D'APPEL",
    'SUPERVISEURS',
    'DISPATCHERS',
    'DISPACTHEUSES',
    'SERVICE AUTHENTIFICATION ET VERIFICATION DE COUPONS',
    'DEVELOPPEUR',
    'CM - MARKETING',
    'SECRETAIRE DE DIRECTION',
    'Turboy Journalier',
    'ménagère',
  ];

  // Données de démonstration pour les demandes
  const requests: LeaveRequest[] = [
    {
      id: '4',
      employeeId: '1',
      employeeName: 'DJEURE YANNICK JUNIOR',
      type: 'annuel',
      startDate: '08/03/2026',
      endDate: '22/03/2026',
      duration: 14,
      statut: 'En attente',
      reason: 'Vacances familiales',
      createdAt: '2026-03-08T00:00:00',
    },
    {
      id: '5',
      employeeId: '2',
      employeeName: 'ZAKARIA',
      type: 'maladie',
      startDate: '10/03/2026',
      endDate: '12/03/2026',
      duration: 2,
      statut: 'Approuvée',
      reason: 'Consultation médicale',
      createdAt: '2026-03-06T00:00:00',
    },
    {
      id: '6',
      employeeId: '3',
      employeeName: 'YAO KOUASSI ISAC',
      type: 'sans solde',
      startDate: '15/03/2026',
      endDate: '16/03/2026',
      duration: 1,
      statut: 'Rejetée',
      reason: 'Motif insuffisant',
      createdAt: '2026-03-05T00:00:00',
    },
    {
      id: '7',
      employeeId: '4',
      employeeName: 'MARIE DUPONT',
      type: 'annuel',
      startDate: '20/03/2026',
      endDate: '25/03/2026',
      duration: 5,
      statut: 'En attente',
      reason: 'Voyage prévu',
      createdAt: '2026-03-07T00:00:00',
    },
  ];

  const requestStats: RequestStats = {
    pending: 2,
    approved: 1,
    rejected: 1,
  };

  const handleAddEmployee = (newEmployee: EmployeeCreateDTO) => {
    ajouterEmployeMutation.mutate(newEmployee);
  };

  const handleEditPosition = (employee: IEmployee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDeactivate = (employee: IEmployee) => {
    modifierEmployeMutation.mutate({
      id: employee.id,
      data: {
        ...employee,
        statut: employee.statut === 'Actif' ? 'Inactif' : 'Actif',
      },
    });
  };

  const handleRemove = (employee: IEmployee) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.name} ?`)) {
      supprimerEmployeMutation.mutate(employee.id);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-primary ">Personnel TURBO</h1>

      <Tabs defaultValue="employees">
        <TabsList className="grid max-w-2xl grid-cols-4 rounded-full">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          {/* <TabsTrigger value="demande">Demandes</TabsTrigger> */}
          <TabsTrigger value="conge">Congés</TabsTrigger>
          <TabsTrigger value="deduction">Deductions</TabsTrigger>
          <TabsTrigger value="payroll">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeTableNew onEditPosition={handleEditPosition} onDeactivate={handleDeactivate} onRemove={handleRemove} onAddEmployee={() => setIsAddModalOpen(true)} />
        </TabsContent>
        {/* <TabsContent value="demande" className="mt-6">
          <LeaveManagement leaveRequests={leaveRequests} leaveStats={leaveStats} />
        </TabsContent> */}
        <TabsContent value="conge" className="mt-6">
          <RequestManagement requests={requests} requestStats={requestStats} employees={[]} />
        </TabsContent>
        <TabsContent value="deduction" className="mt-6">
          <DeductionTabContents />
        </TabsContent>
        <TabsContent value="payroll" className="mt-6">
          <PayrollTable />
        </TabsContent>
      </Tabs>

      <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddEmployee={handleAddEmployee} departments={departments} postes={postes} />

      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          departments={departments}
          postes={postes}
        />
      )}
    </div>
  );
}
