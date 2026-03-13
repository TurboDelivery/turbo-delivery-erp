'use client';

import { useState } from 'react';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { LeaveRequest, RequestStats, Employee } from './types';

interface RequestManagementProps {
  requests: LeaveRequest[];
  requestStats: RequestStats;
  employees: Employee[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onSubmitRequest: (request: Omit<LeaveRequest, 'id' | 'status'>) => void;
}

export function RequestManagement({ 
  requests, 
  requestStats, 
  employees, 
  onApproveRequest, 
  onRejectRequest, 
  onSubmitRequest 
}: RequestManagementProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newRequest, setNewRequest] = useState({
    employeeId: '',
    employeeName: '',
    type: 'annuel' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    duration: 0,
    reason: ''
  });

  const handleSubmitRequest = () => {
    if (!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const employee = employees.find(emp => emp.id === newRequest.employeeId);
    if (!employee) return;

    const duration = calculateDuration(newRequest.startDate, newRequest.endDate);

    onSubmitRequest({
      employeeId: newRequest.employeeId,
      employeeName: employee.name,
      type: newRequest.type,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      duration,
      reason: newRequest.reason
    });

    setNewRequest({
      employeeId: '',
      employeeName: '',
      type: 'annuel',
      startDate: '',
      endDate: '',
      duration: 0,
      reason: ''
    });

    onOpenChange();
  };

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setNewRequest(prev => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || ''
    }));
  };

  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'En attente': return 'warning';
      case 'Approuvée': return 'success';
      case 'Rejetée': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des Flux de Demandes</h2>
        <Button color="primary" onPress={onOpen}>
          Nouvelle demande
        </Button>
      </div>

      {/* Statistiques de traitement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">En attente</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-orange-600">{requestStats.pending}</div>
            <p className="text-sm text-gray-500">Demandes</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Approuvées</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{requestStats.approved}</div>
            <p className="text-sm text-gray-500">Demandes</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Rejetées</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-red-600">{requestStats.rejected}</div>
            <p className="text-sm text-gray-500">Demandes</p>
          </CardBody>
        </Card>
      </div>

      {/* Tableau des demandes */}
      <Table aria-label="Liste des demandes">
        <TableHeader>
          <TableColumn>Employé</TableColumn>
          <TableColumn>Type de congé</TableColumn>
          <TableColumn>Dates</TableColumn>
          <TableColumn>Durée</TableColumn>
          <TableColumn>Motif</TableColumn>
          <TableColumn>Statut</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="font-medium">{request.employeeName}</div>
              </TableCell>
              <TableCell>
                <Badge color="primary" variant="flat" className="capitalize">
                  {request.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>Du: {request.startDate}</div>
                  <div>Au: {request.endDate}</div>
                </div>
              </TableCell>
              <TableCell>{request.duration} jours</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={request.reason}>
                  {request.reason}
                </div>
              </TableCell>
              <TableCell>
                <Badge color={getStatusColor(request.status)} variant="flat">
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                {request.status === 'En attente' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      color="success" 
                      variant="flat"
                      onPress={() => onApproveRequest(request.id)}
                    >
                      Approuver
                    </Button>
                    <Button 
                      size="sm" 
                      color="danger" 
                      variant="flat"
                      onPress={() => onRejectRequest(request.id)}
                    >
                      Rejeter
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal nouvelle demande */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Nouvelle demande de congé
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Employé"
                    placeholder="Sélectionnez un employé"
                    selectedKeys={newRequest.employeeId ? [newRequest.employeeId] : []}
                    onSelectionChange={(keys) => handleEmployeeChange(Array.from(keys)[0] as string)}
                  >
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Type de congé"
                    placeholder="Sélectionnez le type"
                    selectedKeys={[newRequest.type]}
                    onSelectionChange={(keys) => setNewRequest(prev => ({ ...prev, type: Array.from(keys)[0] as LeaveRequest['type'] }))}
                  >
                    <SelectItem key="annuel" value="annuel">Congé annuel</SelectItem>
                    <SelectItem key="maladie" value="maladie">Congé maladie</SelectItem>
                    <SelectItem key="sans solde" value="sans solde">Congé sans solde</SelectItem>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Date de début"
                      value={newRequest.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <Input
                      type="date"
                      label="Date de fin"
                      value={newRequest.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  <Input
                    label="Motif"
                    placeholder="Décrivez le motif de la demande"
                    value={newRequest.reason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleSubmitRequest}>
                  Soumettre la demande
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
