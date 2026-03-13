'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { EmployeeTable } from './employee-table';
import { Employee } from '../../features/personnel/types/types';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: () => void;
  onEditPosition: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onRemove: (employee: Employee) => void;
}

export function EmployeeList({ 
  employees, 
  onAddEmployee, 
  onEditPosition, 
  onDeactivate, 
  onRemove 
}: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Liste des employés</h2>
        <Button 
          color="primary" 
          onPress={onAddEmployee}
          className="bg-primary text-white"
        >
          + Ajouter un employé
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-md"
          startContent={
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onEditPosition={onEditPosition}
        onDeactivate={onDeactivate}
        onRemove={onRemove}
      />
    </div>
  );
}
