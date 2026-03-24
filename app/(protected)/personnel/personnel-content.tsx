'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';

import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { EditEmployeeModal } from '@/components/personnel/edit-employee-modal';
import { LeaveManagement } from '@/components/personnel/leave-management';
import { RequestManagement } from '@/components/personnel/request-management';
import { LoanManagement } from '@/components/personnel/loan-management';
import { Employee, LeaveRequest, LeaveStats, RequestStats, Loan, LoanStats } from '@/features/personnel/types/types';
import { useAjouterEmployeMutation, useModifierEmployeMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { EmployeeTableNew } from '@/components/personnel/employee-table/index';
import { EmployeeCreateDTO } from '@/features/personnel/schemas/employee.schema';
import { useCongesQuery } from '@/features/conge/queries/conge.query';

export default function PersonnelContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
    'Turboy Journalier',
    'ménagère'
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'DJEURE YANNICK JUNIOR',
      type: 'annuel',
      startDate: '01/01/2026',
      endDate: '15/01/2026',
      duration: 14,
      statut: 'En cours',
      reason: 'Vacances familiales'
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'ZAKARIA',
      type: 'maladie',
      startDate: '20/02/2026',
      endDate: '25/02/2026',
      duration: 5,
      statut: 'Terminé',
      reason: 'Grippe'
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'YAO KOUASSI ISAC',
      type: 'sans solde',
      startDate: '10/01/2026',
      endDate: '17/01/2026',
      duration: 7,
      statut: 'En attente',
      reason: 'Affaires personnelles'
    }
  ];

  const leaveStats: LeaveStats = {
    currentlyOnLeave: 1,
    takenThisMonth: 26,
    completedLeaves: 2
  };

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
      createdAt: '2026-03-08T00:00:00'
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
      createdAt: '2026-03-06T00:00:00'
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
      createdAt: '2026-03-05T00:00:00'
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
      createdAt: '2026-03-07T00:00:00'
    }
  ];

  const requestStats: RequestStats = {
    pending: 2,
    approved: 1,
    rejected: 1
  };

  // Données de démonstration pour les prêts
  const loans: Loan[] = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'DJEURE YANNICK JUNIOR',
      type: 'Avance sur salaire',
      amount: 90000,
      reason: 'Avance remboursable sur 3 mois',
      date: '15/03/2026',
      statut: 'En attente',
      repaymentDuration: 3
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'ZAKARIA',
      type: 'Prêt personnel',
      amount: 150000,
      reason: 'Projet personnel',
      date: '10/03/2026',
      statut: 'Approuvé',
      repaymentDuration: 6
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'YAO KOUASSI ISAC',
      type: 'Aide d\'urgence',
      amount: 50000,
      reason: 'Frais médicaux urgents',
      date: '05/03/2026',
      statut: 'En cours',
      repaymentDuration: 2
    }
  ];

  const loanStats: LoanStats = {
    totalLoans: 3,
    pendingApproval: 1,
    activeLoans: 2,
    totalAmount: 290000
  };

  const handleAddEmployee = (newEmployee: EmployeeCreateDTO) => {
    ajouterEmployeMutation.mutate(newEmployee);
  };

  const handleEditPosition = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
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

  const handleApproveRequest = (requestId: string) => {
    console.log('Approuver demande:', requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    console.log('Rejeter demande:', requestId);
  };

  const handleSubmitRequest = (request: Omit<LeaveRequest, 'id' | 'statut'>) => {
    console.log('Soumettre demande:', request);
  };

  const handleAddLoan = (loan: Omit<Loan, 'id'>) => {
    console.log('Ajouter prêt:', loan);
  };

  const handleUpdateLoanStatus = (loanId: string, action: 'hold' | 'extend') => {
    console.log('Mettre à jour prêt:', loanId, action);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-primary ">Personnel TURBO</h1>
      
      <Tabs defaultValue="employees" className=" ">
        <TabsList className="grid max-w-2xl grid-cols-4 rounded-full">
          <TabsTrigger value="employees">Employés</TabsTrigger>
           <TabsTrigger value="conge">Congé</TabsTrigger>
           <TabsTrigger value="demande">Demande</TabsTrigger>
           <TabsTrigger value="deduction">Deduction</TabsTrigger>
        </TabsList>


        <TabsContent value="employees" className="mt-6">
          <EmployeeTableNew
            onEditPosition={handleEditPosition}
            onDeactivate={handleDeactivate}
            onRemove={handleRemove}
            onAddEmployee={() => setIsAddModalOpen(true)}
          />
        </TabsContent>
        <TabsContent value="conge" className="mt-6">
          <LeaveManagement leaveRequests={leaveRequests} leaveStats={leaveStats} />
        </TabsContent>
        <TabsContent value="demande" className="mt-6">
          <RequestManagement 
            requests={requests} 
            requestStats={requestStats}
            employees={[]}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onSubmitRequest={handleSubmitRequest}
          />
        </TabsContent>
        <TabsContent value="deduction" className="mt-6">
          <LoanManagement 
            loans={loans} 
            loanStats={loanStats}
            employees={[]}
            onAddLoan={handleAddLoan}
            onUpdateLoanStatus={handleUpdateLoanStatus}
          />
        </TabsContent>
      </Tabs>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEmployee={handleAddEmployee}
        departments={departments}
        postes={postes}
      />
      
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