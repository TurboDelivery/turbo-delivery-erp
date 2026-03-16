'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';

import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { EditEmployeeModal } from '@/components/personnel/edit-employee-modal';
import { Employee} from '@/features/personnel/types/types';
import { useAjouterEmployeMutation, useModifierEmployeMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { EmployeeTableNew } from '@/components/personnel/employee-table/index';
import { EmployeeCreateDTO } from '@/features/personnel/schemas/employee.schema';

export default function PersonnelContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-primary ">Personnel TURBO</h1>
      
      <Tabs defaultValue="employees" className=" ">
        <TabsList className="grid max-w-2xl grid-cols-4 rounded-full">
          <TabsTrigger value="employees">Employés</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeTableNew
            onEditPosition={handleEditPosition}
            onDeactivate={handleDeactivate}
            onRemove={handleRemove}
            onAddEmployee={() => setIsAddModalOpen(true)}
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