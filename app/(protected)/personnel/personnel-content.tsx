'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';

import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { EditEmployeeModal } from '@/components/personnel/edit-employee-modal';
import { RequestManagement } from '@/components/personnel/request-management';
import { IEmployee } from '@/features/personnel/types/types';
import { useAjouterEmployeMutation, useModifierEmployeMutation, useSupprimerEmployeMutation, useSyncJournaliersMutation } from '@/features/personnel/mutations/employee.mutation';
import { Button } from '@heroui/react';
import { RefreshCw } from 'lucide-react';
import EmployeeTableNew from '@/components/personnel/employee-table/index';
import DeductionTabContents from '@/components/personnel/deductions/deduction-tab-contents';
import PayrollTable from '@/components/personnel/payroll/table/payroll-table';
import { useLeaveRequestListQuery } from '@/features/personnel/queries/leave-request-list.query';

export default function PersonnelContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);

  const ajouterEmployeMutation = useAjouterEmployeMutation();
  const modifierEmployeMutation = useModifierEmployeMutation();
  const supprimerEmployeMutation = useSupprimerEmployeMutation();
  const syncJournaliersMutation = useSyncJournaliersMutation();

  const { data: leaveData } = useLeaveRequestListQuery({});
  const requests = leaveData?.content ?? [];
  const requestStats = {
    pending: requests.filter((r) => r.statut === 'En attente').length,
    approved: requests.filter((r) => r.statut === 'Approuvée').length,
    rejected: requests.filter((r) => r.statut === 'Rejetée').length,
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
    supprimerEmployeMutation.mutate(employee.id);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Personnel TURBO</h1>
        <Button
          variant="bordered"
          startContent={<RefreshCw size={16} className={syncJournaliersMutation.isPending ? 'animate-spin' : ''} />}
          isLoading={syncJournaliersMutation.isPending}
          onPress={() => syncJournaliersMutation.mutate()}
        >
          Synchroniser
        </Button>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="grid max-w-2xl grid-cols-4 rounded-full">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="conge">Congés</TabsTrigger>
          <TabsTrigger value="deduction">Deductions</TabsTrigger>
          <TabsTrigger value="payroll">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeTableNew onEditPosition={handleEditPosition} onDeactivate={handleDeactivate} onRemove={handleRemove} onAddEmployee={() => setIsAddModalOpen(true)} />
        </TabsContent>
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

      <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddEmployee={(newEmployee) => ajouterEmployeMutation.mutate(newEmployee)} />

      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
}
