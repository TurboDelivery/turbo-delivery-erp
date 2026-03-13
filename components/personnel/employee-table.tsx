'use client';

import { Button } from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Employee } from '../../features/personnel/types/types';
import { cn } from '@/lib/utils';
import { useModifierEmployeMutation, useSupprimerEmployeMutation } from '../../features/personnel/mutations/employee.mutation';
import { EditEmployeeModal } from './edit-employee-modal';
import { useState } from 'react';

interface EmployeeTableProps {
  employees: Employee[];
  departments: Array<{ name: string; id: string }>;
  postes: string[];
  onEditPosition: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onRemove: (employee: Employee) => void;
}

export function EmployeeTable({ employees, departments, postes, onEditPosition, onDeactivate, onRemove }: EmployeeTableProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const modifierEmployeMutation = useModifierEmployeMutation();
  const supprimerEmployeMutation = useSupprimerEmployeMutation();

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.name} ?`)) {
      supprimerEmployeMutation.mutate(employee.id);
    }
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

  const getStatusClasses = (statut: Employee['statut']) => {
    switch (statut) {
      case 'Actif':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium';
      case 'Inactif':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium';
      case 'Congé':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  return (
    <>
      <Table aria-label="Liste des employés">
        <TableHeader>
          <TableColumn>NOM</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>POSTE</TableColumn>
          <TableColumn>DÉPARTEMENT</TableColumn>
          <TableColumn>SALAIRE</TableColumn>
          <TableColumn>STATUT</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            console.log('🔍 Employee dans tableau:', employee);
            return (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.salary.toLocaleString()} F</TableCell>
              <TableCell>
                <span 
                  className={cn(
                    getStatusClasses(employee.statut)
                  )}
                  style={{
                    backgroundColor: employee.statut === 'Actif' ? '#dcfce7' : 
                                   employee.statut === 'Inactif' ? '#fee2e2' : 
                                   employee.statut === 'Congé' ? '#fef3c7' : '#f3f4f6',
                    color: employee.statut === 'Actif' ? '#166534' : 
                           employee.statut === 'Inactif' ? '#991b1b' : 
                           employee.statut === 'Congé' ? '#a16207' : '#374151',
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {employee.statut}
                </span>
              </TableCell>
              <TableCell>
                <div className="relative flex justify-center">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        className="text-gray-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Actions">
                      <DropdownItem 
                        key="edit"
                        onPress={() => handleEdit(employee)}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownItem 
                        key="deactivate"
                        onPress={() => handleDeactivate(employee)}
                      >
                        {employee.statut === 'Actif' ? 'Désactiver' : 'Activer'}
                      </DropdownItem>
                      <DropdownItem 
                        key="delete" 
                        className="text-danger"
                        onPress={() => handleDelete(employee)}
                      >
                        Supprimer
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>

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
    </>
  );
}
