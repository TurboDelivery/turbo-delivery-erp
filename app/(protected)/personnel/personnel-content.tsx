'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';
import { EmployeeList } from '@/components/personnel/employee-list';
// import { LeaveManagement } from '@/components/personnel/leave-management';
// import { RequestManagement } from '@/components/personnel/request-management';
// import { DeductionsManagement } from '@/components/personnel/deductions-management';
import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { Employee, LeaveRequest, Deduction } from '@/features/personnel/types/types';
import { EmployeeCreateDTO } from '@/features/personnel/schemas/employee.schema';
import { useAjouterEmployeMutation, useModifierEmployeMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { useEmployeeListQuery } from '@/features/personnel/queries/employee-list.query';

export default function PersonnelContent() {
//   const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
//   const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: employeesData, isLoading, isError } = useEmployeeListQuery({});
  const employees = employeesData?.content || [];
  const ajouterEmployeMutation = useAjouterEmployeMutation();
  const modifierEmployeMutation = useModifierEmployeMutation();
  const supprimerEmployeMutation = useSupprimerEmployeMutation();

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
    { id: '9', name: 'INFORMATIQUE' }
  ];

  const postes = [
    'DIRECTEUR GENERAL',
    'DIRECTEUR GENERAL ADJOINT',
    'RESPONSABLE DES OPERATIONS',
    'RESPONSABLE COMPTABLE',
    'RESPONSABLE DES RECOUVREMENTS',
    'CHEF AUX OPERATIONS',
    'STANDARDISTE',
    'AGENT DE LA CENTRALE D\'APPEL',
    'SUPERVISEURS',
    'DISPATCHERS',
    'DISPACTHEUSES',
    'SERVICE AUTHENTIFICATION ET VERIFICATION DE COUPONS',
    'DEVELOPPEUR',
    'CM - MARKETING',
    'SECRETAIRE DE DIRECTION',
    'Turboy Journalier'
  ];

  const handleAddEmployee = (newEmployee: EmployeeCreateDTO) => {
    ajouterEmployeMutation.mutate(newEmployee);
  };

  const handleEditPosition = (employee: Employee) => {
    console.log('Edit position:', employee);
    // TODO: Implement edit position functionality
  };

  const handleDeactivate = (employee: Employee) => {
    modifierEmployeMutation.mutate({
      id: employee.id,
      data: {
        ...employee,
        statut: employee.statut === 'Actif' ? 'Inactif' : 'Actif'
      }
    });
  };

  const handleRemove = (employee: Employee) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.name} ?`)) {
      supprimerEmployeMutation.mutate(employee.id);
    }
  };

  // Commenté temporairement pour éviter les erreurs de build
  // const handleApproveRequest = (requestId: string) => {
  //   setLeaveRequests(prev =>
  //     prev.map(req =>
  //       req.id === requestId
  //         ? { ...req, statut: 'Approuvée' as LeaveRequest['statut'] }
  //         : req
  //     )
  //   );
  // };

  // const handleRejectRequest = (requestId: string) => {
  //   setLeaveRequests(prev =>
  //     prev.map(req =>
  //       req.id === requestId
  //         ? { ...req, statut: 'Rejetée' as LeaveRequest['statut'] }
  //         : req
  //     )
  //   );
  // };

  // const handleSubmitRequest = (newRequest: Omit<LeaveRequest, 'id' | 'statut'>) => {
  //   const request: LeaveRequest = {
  //     ...newRequest,
  //     id: Date.now().toString(),
  //     statut: 'En attente'
  //   };
  //   setLeaveRequests(prev => [...prev, request]);
  // };

  // const handleCreateDeduction = (newDeduction: Omit<Deduction, 'id'>) => {
  //   const deduction: Deduction = {
  //     ...newDeduction,
  //     id: Date.now().toString()
  //   };
  //   setDeductions(prev => [...prev, deduction]);
  // };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-primary ">Personnel TURBO</h1>
      
      <Tabs defaultValue="employees" className=" ">
        <TabsList className="grid max-w-2xl grid-cols-4 rounded-full">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          {/* <TabsTrigger value="leaves">Congés</TabsTrigger>
          <TabsTrigger value="requests">Demande</TabsTrigger>
          <TabsTrigger value="deductions">Déductions</TabsTrigger> */}
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeList
            employees={employees}
            departments={departments}
            postes={postes}
            onAddEmployee={() => setIsAddModalOpen(true)}
            onEditPosition={handleEditPosition}
            onDeactivate={handleDeactivate}
            onRemove={handleRemove}
          />
        </TabsContent>

        <TabsContent value="leaves" className="mt-6">
          {/* <LeaveManagement
            leaveRequests={leaveRequests}
            leaveStats={[]}
          /> */}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {/* <RequestManagement
            requests={leaveRequests.filter(req => req.statut === 'En attente' || req.statut === 'Approuvée' || req.statut === 'Rejetée')}
            requestStats={[]}
            employees={employees}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onSubmitRequest={handleSubmitRequest}
          /> */}
        </TabsContent>

        <TabsContent value="deductions" className="mt-6">
          {/* <DeductionsManagement
            deductions={deductions}
            deductionStats={[]}
            employees={employees}
            onCreateDeduction={handleCreateDeduction}
          /> */}
        </TabsContent>
      </Tabs>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEmployee={handleAddEmployee}
        departments={departments}
        postes={postes}
      />
    </div>
  );
}