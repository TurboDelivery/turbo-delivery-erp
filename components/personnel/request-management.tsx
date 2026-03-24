'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { RequestTable } from './request-table';
import { LeaveRequest, RequestStats, Employee } from '../../features/personnel/types/types';

interface RequestManagementProps {
  requests: LeaveRequest[];
  requestStats: RequestStats;
  employees: Employee[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onSubmitRequest: (request: Omit<LeaveRequest, 'id' | 'statut'>) => void;
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
    durationType: 'mois' as 'mois' | 'quinzaine' | 'semaine' | 'personnalise',
    reason: ''
  });

  const [leaveBalance, setLeaveBalance] = useState(30);
  const [isEligible, setIsEligible] = useState(true);
  const [eligibilityDate, setEligibilityDate] = useState('15/06/2024');

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
      durationType: 'mois',
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

  const calculateEndDate = (startDate: string, durationType: string): string => {
    const start = new Date(startDate);
    let daysToAdd = 0;
    
    switch (durationType) {
      case 'mois':
        daysToAdd = 30;
        break;
      case 'quinzaine':
        daysToAdd = 15;
        break;
      case 'semaine':
        daysToAdd = 7;
        break;
      case 'personnalise':
        return newRequest.endDate;
      default:
        daysToAdd = 30;
    }
    
    const end = new Date(start);
    end.setDate(start.getDate() + daysToAdd - 1);
    return end.toISOString().split('T')[0];
  };

  const getRemainingBalance = (): number => {
    return Math.max(0, leaveBalance - newRequest.duration);
  };

  useEffect(() => {
    if (newRequest.startDate && newRequest.durationType !== 'personnalise') {
      const endDate = calculateEndDate(newRequest.startDate, newRequest.durationType);
      const duration = calculateDuration(newRequest.startDate, endDate);
      setNewRequest(prev => ({
        ...prev,
        endDate,
        duration
      }));
    }
  }, [newRequest.startDate, newRequest.durationType]);

  useEffect(() => {
    if (newRequest.durationType !== 'personnalise' && newRequest.durationType && !newRequest.startDate) {
      // Si aucune date de début n'est choisie, on met la date du jour par défaut
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(today, newRequest.durationType);
      const duration = calculateDuration(today, endDate);
      setNewRequest(prev => ({
        ...prev,
        startDate: today,
        endDate,
        duration
      }));
    }
  }, [newRequest.durationType]);

  useEffect(() => {
    if (newRequest.startDate && newRequest.endDate) {
      const duration = calculateDuration(newRequest.startDate, newRequest.endDate);
      setNewRequest(prev => ({ ...prev, duration }));
    }
  }, [newRequest.startDate, newRequest.endDate]);

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setNewRequest(prev => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || ''
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Demandes de congé</h2>
        <Button color="primary" onPress={onOpen}>
          Nouvelle demande
        </Button>
      </div>

      {/* Statistiques de traitement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Demandes en attente</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-yellow-600">{requestStats.pending}</div>
            <p className="text-sm text-gray-500">En attente de validation</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Demandes approuvées</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{requestStats.approved}</div>
            <p className="text-sm text-gray-500">Validées</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">Demandes rejetées</h3>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold text-red-600">{requestStats.rejected}</div>
            <p className="text-sm text-gray-500">Refusées</p>
          </CardBody>
        </Card>
      </div>

      {/* Tableau des demandes */}
      <RequestTable 
        requests={requests} 
        onApproveRequest={onApproveRequest}
        onRejectRequest={onRejectRequest}
      />

      {/* Modal nouvelle demande */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Nouvelle demande de congé
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employé</label>
                    <Select
                      placeholder="Sélectionnez un employé"
                      selectedKeys={newRequest.employeeId ? [newRequest.employeeId] : []}
                      onSelectionChange={(keys) => handleEmployeeChange(Array.from(keys)[0] as string)}
                      classNames={{
                        trigger: "h-12",
                      }}
                    >
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Eligibility Banner */}
                  {newRequest.employeeId && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Éligible au congé annuel (ancienneté &gt; 1 an depuis le {eligibilityDate})
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            {leaveBalance} jours à partir du 01/04/2026
                          </p>
                        </div>
                        <div className="bg-green-100 rounded-full p-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de congé</label>
                    <Select
                      placeholder="Sélectionnez le type"
                      selectedKeys={[newRequest.type]}
                      onSelectionChange={(keys) => setNewRequest(prev => ({ ...prev, type: Array.from(keys)[0] as LeaveRequest['type'] }))}
                      classNames={{
                        trigger: "h-12",
                      }}
                    >
                      <SelectItem key="annuel" value="annuel">Congé annuel</SelectItem>
                      <SelectItem key="maladie" value="maladie">Congé maladie</SelectItem>
                      <SelectItem key="sans solde" value="sans solde">Congé sans solde</SelectItem>
                    </Select>
                  </div>

                  {/* Duration Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Durée</label>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant={newRequest.durationType === 'mois' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'mois' ? 'primary' : 'default'}
                        size="sm"
                        onClick={() => setNewRequest(prev => ({ ...prev, durationType: 'mois' }))}
                        className="h-12 text-xs"
                      >
                        Mois (30j)
                      </Button>
                      <Button
                        variant={newRequest.durationType === 'quinzaine' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'quinzaine' ? 'primary' : 'default'}
                        size="sm"
                        onClick={() => setNewRequest(prev => ({ ...prev, durationType: 'quinzaine' }))}
                        className="h-12 text-xs"
                      >
                        Quinzaine (15j)
                      </Button>
                      <Button
                        variant={newRequest.durationType === 'semaine' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'semaine' ? 'primary' : 'default'}
                        size="sm"
                        onClick={() => setNewRequest(prev => ({ ...prev, durationType: 'semaine' }))}
                        className="h-12 text-xs"
                      >
                        Semaine (7j)
                      </Button>
                      <Button
                        variant={newRequest.durationType === 'personnalise' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'personnalise' ? 'primary' : 'default'}
                        size="sm"
                        onClick={() => setNewRequest(prev => ({ ...prev, durationType: 'personnalise' }))}
                        className="h-12 text-xs"
                      >
                        Personnalisé
                      </Button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                      <Input
                        type="date"
                        value={newRequest.startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest(prev => ({ ...prev, startDate: e.target.value }))}
                        classNames={{
                          input: "h-12",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                      <Input
                        type="date"
                        value={newRequest.endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest(prev => ({ ...prev, endDate: e.target.value }))}
                        disabled={newRequest.durationType !== 'personnalise'}
                        classNames={{
                          input: "h-12",
                        }}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  {newRequest.duration > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Résumé</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{newRequest.duration} jours de congé</span>
                        <span className="text-sm font-medium text-gray-800">
                          Solde restant après ce congé : {getRemainingBalance()} jours
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleSubmitRequest}>
                  Créer la demande
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
