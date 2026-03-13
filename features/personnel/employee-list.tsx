'use client';

import { useState } from 'react';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { MoreVertical } from 'lucide-react';
import { Employee } from './types';

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

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'Actif': return 'success';
      case 'Congé': return 'warning';
      case 'Inactif': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Liste des employés</h2>
        <Button 
          color="primary" 
          onPress={onAddEmployee}
          className="bg-blue-600 text-white"
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

      <Table aria-label="Liste des employés">
        <TableHeader>
          <TableColumn>Employé</TableColumn>
          <TableColumn>Fonction</TableColumn>
          <TableColumn>Département</TableColumn>
          <TableColumn>Salaire</TableColumn>
          <TableColumn>Statut</TableColumn>
          <TableColumn>Date d'entrée</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-500">{employee.email}</div>
                </div>
              </TableCell>
              <TableCell>{employee.function}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.salary.toLocaleString()} F</TableCell>
              <TableCell>
                <Badge color={getStatusColor(employee.status)} variant="flat">
                  {employee.status}
                </Badge>
              </TableCell>
              <TableCell>{employee.entryDate}</TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem 
                      key="edit"
                      onPress={() => onEditPosition(employee)}
                    >
                      Modifier le poste
                    </DropdownItem>
                    <DropdownItem 
                      key="deactivate"
                      onPress={() => onDeactivate(employee)}
                    >
                      Désactiver
                    </DropdownItem>
                    <DropdownItem 
                      key="remove"
                      className="text-danger"
                      onPress={() => onRemove(employee)}
                    >
                      Retirer
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
