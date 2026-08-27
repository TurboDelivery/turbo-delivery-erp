'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';

import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { EditEmployeeModal } from '@/components/personnel/edit-employee-modal';
import { RequestManagement } from '@/components/personnel/request-management';
import { IEmployee } from '@/features/personnel/types/types';
import { useAjouterEmployeMutation, useModifierEmployeMutation, useSupprimerEmployeMutation, useSyncJournaliersMutation } from '@/features/personnel/mutations/employee.mutation';
import { Button } from '@/components/heroui';
import { RefreshCw } from 'lucide-react';
import EmployeeTableNew from '@/components/personnel/employee-table/index';
import DeductionTabContents from '@/components/personnel/deductions/deduction-tab-contents';
import PayrollTable from '@/components/personnel/payroll/table/payroll-table';
import { useLeaveRequestListQuery } from '@/features/personnel/queries/leave-request-list.query';
import { AnomaliesTab } from '@/features/personnel/components/anomalies-tab';
import { ContratsTab } from '@/features/personnel/components/contrats-tab';
import { EffectifTab } from '@/features/personnel/components/effectif-tab';
import { MasseSalarialeTab } from '@/features/personnel/components/masse-salariale-tab';
import { PersonnelKpis } from '@/features/personnel/components/personnel-kpis';

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
    // Pleine largeur : `container mx-auto` plafonnait la page au point de rupture Tailwind
    // (1280 px en xl) et la centrait, laissant une large bande vide à droite alors que les
    // tableaux d'effectif et de masse salariale ont beaucoup de colonnes. Le `p-6` est lui
    // aussi retiré : ContentAnimation en pose déjà un autour de toutes les pages, il était
    // donc appliqué deux fois.
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Personnel TURBO</h1>
        <Button
          variant="bordered"
          // Un seul indicateur d'attente : HeroUI affiche déjà son propre spinner quand
          // `isLoading` est vrai, et il conserve `startContent`. Faire tourner l'icône en
          // plus donnait deux cercles qui tournaient côte à côte. L'icône est donc masquée
          // pendant le chargement et laisse la place au spinner du bouton.
          startContent={syncJournaliersMutation.isPending ? undefined : <RefreshCw size={16} />}
          isLoading={syncJournaliersMutation.isPending}
          onPress={() => syncJournaliersMutation.mutate()}
        >
          Synchroniser
        </Button>
      </div>

      {/* SPEC-ERP-TURBO-PERSONNEL-v1.1 — synthèse de tête, alimentée par les mêmes
          requêtes que les nouveaux onglets (aucun appel supplémentaire). */}
      <div className="mb-6">
        <PersonnelKpis />
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="flex flex-wrap justify-start gap-1 rounded-2xl">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="conge">Congés</TabsTrigger>
          <TabsTrigger value="deduction">Deductions</TabsTrigger>
          <TabsTrigger value="payroll">Paiements</TabsTrigger>
          <TabsTrigger value="effectif">Effectif</TabsTrigger>
          <TabsTrigger value="masse">Masse salariale</TabsTrigger>
          <TabsTrigger value="contrats">Contrats &amp; déclarations</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
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
        <TabsContent value="effectif" className="mt-6">
          <EffectifTab />
        </TabsContent>
        <TabsContent value="masse" className="mt-6">
          <MasseSalarialeTab />
        </TabsContent>
        <TabsContent value="contrats" className="mt-6">
          <ContratsTab />
        </TabsContent>
        <TabsContent value="anomalies" className="mt-6">
          <AnomaliesTab />
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
