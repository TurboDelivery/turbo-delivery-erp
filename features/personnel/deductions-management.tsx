'use client';

import { useState } from 'react';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Deduction, DeductionStats, Employee } from './types';

interface DeductionsManagementProps {
  deductions: Deduction[];
  deductionStats: DeductionStats;
  employees: Employee[];
  onCreateDeduction: (deduction: Omit<Deduction, 'id'>) => void;
}

export function DeductionsManagement({ 
  deductions, 
  deductionStats, 
  employees, 
  onCreateDeduction 
}: DeductionsManagementProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newDeduction, setNewDeduction] = useState({
    employeeId: '',
    employeeName: '',
    type: 'Retard' as Deduction['type'],
    amount: '',
    reason: '',
    repaymentDuration: ''
  });

  const handleSubmitDeduction = () => {
    if (!newDeduction.employeeId || !newDeduction.amount || !newDeduction.reason) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const employee = employees.find(emp => emp.id === newDeduction.employeeId);
    if (!employee) return;

    onCreateDeduction({
      employeeId: newDeduction.employeeId,
      employeeName: employee.name,
      type: newDeduction.type,
      amount: parseInt(newDeduction.amount),
      reason: newDeduction.reason,
      date: new Date().toISOString().split('T')[0],
      status: 'En attente',
      repaymentDuration: newDeduction.type === 'Avance sur salaire' ? parseInt(newDeduction.repaymentDuration) : undefined
    });

    setNewDeduction({
      employeeId: '',
      employeeName: '',
      type: 'Retard',
      amount: '',
      reason: '',
      repaymentDuration: ''
    });

    onOpenChange();
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setNewDeduction(prev => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || ''
    }));
  };

  const getStatusColor = (status: Deduction['status']) => {
    switch (status) {
      case 'Appliquée': return 'success';
      case 'En attente': return 'warning';
      default: return 'default';
    }
  };

  const getTypeColor = (type: Deduction['type']) => {
    switch (type) {
      case 'Retard': return 'warning';
      case 'Absence injustifiée': return 'danger';
      case 'Dommage matériel': return 'secondary';
      case 'Avance sur salaire': return 'primary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Système de Déductions et Sanctions</h2>
        <Button color="primary" onPress={onOpen}>
          Créer une déduction
        </Button>
      </div>

      {/* Suivi financier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total déductions ce mois</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-red-600">{deductionStats.totalThisMonth.toLocaleString()} F</div>
            <p className="text-sm text-gray-500">Montant appliqué</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">En attente de validation</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-orange-600">{deductionStats.pendingValidation.toLocaleString()} F</div>
            <p className="text-sm text-gray-500">Montant en attente</p>
          </CardBody>
        </Card>
      </div>

      {/* Tableau des déductions */}
      <Table aria-label="Liste des déductions">
        <TableHeader>
          <TableColumn>Employé</TableColumn>
          <TableColumn>Type de déduction</TableColumn>
          <TableColumn>Montant</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Motif</TableColumn>
          <TableColumn>Statut</TableColumn>
          <TableColumn>Durée de remboursement</TableColumn>
        </TableHeader>
        <TableBody>
          {deductions.map((deduction) => (
            <TableRow key={deduction.id}>
              <TableCell>
                <div className="font-medium">{deduction.employeeName}</div>
              </TableCell>
              <TableCell>
                <Badge 
                  color={getTypeColor(deduction.type)} 
                  variant="flat"
                  className="capitalize"
                >
                  {deduction.type}
                </Badge>
              </TableCell>
              <TableCell>{deduction.amount.toLocaleString()} F</TableCell>
              <TableCell>{deduction.date}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={deduction.reason}>
                  {deduction.reason}
                </div>
              </TableCell>
              <TableCell>
                <Badge color={getStatusColor(deduction.status)} variant="flat">
                  {deduction.status}
                </Badge>
              </TableCell>
              <TableCell>
                {deduction.repaymentDuration ? `${deduction.repaymentDuration} mois` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal création déduction */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Créer une déduction
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Employé"
                    placeholder="Sélectionnez un employé"
                    selectedKeys={newDeduction.employeeId ? [newDeduction.employeeId] : []}
                    onSelectionChange={(keys) => handleEmployeeChange(Array.from(keys)[0] as string)}
                  >
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Type de déduction"
                    placeholder="Sélectionnez le type"
                    selectedKeys={[newDeduction.type]}
                    onSelectionChange={(keys) => setNewDeduction(prev => ({ ...prev, type: Array.from(keys)[0] as Deduction['type'] }))}
                  >
                    <SelectItem key="Retard" value="Retard">Retards répétés</SelectItem>
                    <SelectItem key="Absence injustifiée" value="Absence injustifiée">Absences injustifiées</SelectItem>
                    <SelectItem key="Dommage matériel" value="Dommage matériel">Dommages matériels</SelectItem>
                    <SelectItem key="Avance sur salaire" value="Avance sur salaire">Avance sur salaire</SelectItem>
                  </Select>

                  <Input
                    type="number"
                    label="Montant"
                    placeholder="Entrez le montant"
                    value={newDeduction.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeduction(prev => ({ ...prev, amount: e.target.value }))}
                    endContent="F"
                  />

                  {newDeduction.type === 'Avance sur salaire' && (
                    <Input
                      type="number"
                      label="Durée de remboursement (mois)"
                      placeholder="Entrez la durée en mois"
                      value={newDeduction.repaymentDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeduction(prev => ({ ...prev, repaymentDuration: e.target.value }))}
                    />
                  )}

                  <Input
                    label="Motif / Pièce justificative"
                    placeholder="Décrivez le motif ou référencez la pièce justificative"
                    value={newDeduction.reason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeduction(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleSubmitDeduction}>
                  Créer la déduction
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
