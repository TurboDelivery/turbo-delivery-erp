'use client';

import { cn } from '@/lib/utils';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table';
import { MoreVertical } from 'lucide-react';
import { Employee } from '../../features/personnel/types/types';

interface EmployeeTableProps {
  employees: Employee[];
  onEditPosition: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onRemove: (employee: Employee) => void;
}

export function EmployeeTable({ 
  employees, 
  onEditPosition, 
  onDeactivate, 
  onRemove 
}: EmployeeTableProps) {
  const getStatusClasses = (status: Employee['status']) => {
    return cn(
      'capitalize',
      status === 'Actif' && 'bg-green-200 text-green-800',
      status === 'Congé' && 'bg-yellow-200 text-yellow-800',
      status === 'Inactif' && 'bg-red-200 text-red-800'
    );
  };

  return (
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
        {employees.map((employee) => (
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
              <span 
                className={getStatusClasses(employee.status)}
                style={{
                  backgroundColor: employee.status === 'Actif' ? 'bg-green-200 text-green-800' : 
                                 employee.status === 'Congé' ? 'bg-yellow-200 text-yellow-800' : 
                                 employee.status === 'Inactif' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}
              >
                {employee.status}
              </span>
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
  );
}
