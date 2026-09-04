'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/heroui';
import { Select, SelectItem } from '@/components/heroui';
import { IEmployee, LeaveRequest } from '@/features/personnel/types/types';

interface RequestFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  editingRequestId: string | null;
  employees: IEmployee[];
  initialRequest: Partial<LeaveRequest>;
  onSubmit: (request: any) => void;
  onCancel: () => void;
}

export function RequestForm({ isOpen, onOpenChange, isEditMode, editingRequestId, employees, initialRequest, onSubmit }: RequestFormProps) {
  console.log('🔍 RequestForm - initialRequest reçu:', initialRequest);
  console.log('🔍 RequestForm - isEditMode:', isEditMode);
  console.log('🔍 RequestForm - editingRequestId:', editingRequestId);

  const [request, setRequest] = useState({
    employeeId: '',
    employeeName: '',
    type: 'ANNUEL' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    duration: 0,
    durationType: 'mois',
    reason: '',
    statut: 'EN_ATTENTE' as string,
    ...initialRequest,
  });

  const [leaveBalance] = useState(30);
  const [eligibilityDate] = useState('15/06/2024');

  // Synchroniser le formulaire avec initialRequest quand il change
  useEffect(() => {
    console.log('🔍 useEffect - initialRequest changé:', initialRequest);
    if (Object.keys(initialRequest).length > 0) {
      setRequest((prev) => ({
        ...prev,
        ...initialRequest,
      }));
    }
  }, [initialRequest, isEditMode]);

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
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
        daysToAdd = request.duration || 1;
        break;
    }

    const end = new Date(start);
    end.setDate(end.getDate() + daysToAdd);
    return end.toISOString().split('T')[0];
  };

  const getRemainingBalance = (): number => {
    return Math.max(0, leaveBalance - request.duration);
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    setRequest((prev) => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || '',
    }));
  };

  useEffect(() => {
    if (request.startDate && request.durationType !== 'personnalise') {
      const endDate = calculateEndDate(request.startDate, request.durationType);
      const duration = calculateDuration(request.startDate, endDate);
      setRequest((prev) => ({
        ...prev,
        endDate,
        duration,
      }));
    }
  }, [request.startDate, request.durationType]);

  useEffect(() => {
    if (request.durationType !== 'personnalise' && request.durationType && !request.startDate) {
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(today, request.durationType);
      const duration = calculateDuration(today, endDate);
      setRequest((prev) => ({
        ...prev,
        startDate: today,
        endDate,
        duration,
      }));
    }
  }, [request.durationType]);

  useEffect(() => {
    if (request.startDate && request.endDate) {
      const duration = calculateDuration(request.startDate, request.endDate);
      setRequest((prev) => ({ ...prev, duration }));
    }
  }, [request.startDate, request.endDate]);

  const handleSubmit = () => {
    onSubmit(request);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{isEditMode ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'}</ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Employé</label>
                  <Select
                    placeholder="Sélectionnez un employé"
                    selectedKeys={request.employeeId ? [request.employeeId] : []}
                    onSelectionChange={(keys) => handleEmployeeChange(Array.from(keys)[0] as string)}
                    classNames={{
                      trigger: 'h-12',
                    }}
                  >
                    {employees.map((employee: IEmployee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Eligibility Banner */}
                {request.employeeId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Éligible au congé annuel (ancienneté &gt; 1 an depuis le {eligibilityDate})</p>
                        <p className="text-xs text-green-600 mt-1">{leaveBalance} jours à partir du 01/04/2026</p>
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
                  <label className="block text-sm font-medium text-foreground mb-2">Type de congé</label>
                  <Select
                    placeholder="Sélectionnez le type"
                    selectedKeys={[request.type]}
                    onSelectionChange={(keys) => setRequest((prev) => ({ ...prev, type: Array.from(keys)[0] as LeaveRequest['type'] }))}
                    classNames={{
                      trigger: 'h-12',
                    }}
                  >
                    <SelectItem key="ANNUEL" value="ANNUEL">
                      Congé annuel
                    </SelectItem>
                    <SelectItem key="MALADIE" value="MALADIE">
                      Congé maladie
                    </SelectItem>
                    <SelectItem key="SANS_SOLDE" value="SANS_SOLDE">
                      Congé sans solde
                    </SelectItem>
                    <SelectItem key="MATERNITE" value="MATERNITE">
                      Congé maternité
                    </SelectItem>
                  </Select>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Durée</label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant={request.durationType === 'mois' ? 'solid' : 'bordered'}
                      color={request.durationType === 'mois' ? 'primary' : 'default'}
                      size="sm"
                      onPress={() => setRequest((prev) => ({ ...prev, durationType: 'mois' }))}
                      className="h-12 text-xs"
                    >
                      Mois (30j)
                    </Button>
                    <Button
                      variant={request.durationType === 'quinzaine' ? 'solid' : 'bordered'}
                      color={request.durationType === 'quinzaine' ? 'primary' : 'default'}
                      size="sm"
                      onPress={() => setRequest((prev) => ({ ...prev, durationType: 'quinzaine' }))}
                      className="h-12 text-xs"
                    >
                      Quinzaine (15j)
                    </Button>
                    <Button
                      variant={request.durationType === 'semaine' ? 'solid' : 'bordered'}
                      color={request.durationType === 'semaine' ? 'primary' : 'default'}
                      size="sm"
                      onPress={() => setRequest((prev) => ({ ...prev, durationType: 'semaine' }))}
                      className="h-12 text-xs"
                    >
                      Semaine (7j)
                    </Button>
                    <Button
                      variant={request.durationType === 'personnalise' ? 'solid' : 'bordered'}
                      color={request.durationType === 'personnalise' ? 'primary' : 'default'}
                      size="sm"
                      onPress={() => setRequest((prev) => ({ ...prev, durationType: 'personnalise' }))}
                      className="h-12 text-xs"
                    >
                      Personnalisé
                    </Button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date de début</label>
                    <Input
                      type="date"
                      value={request.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequest((prev) => ({ ...prev, startDate: e.target.value }))}
                      classNames={{
                        input: 'h-12',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date de fin</label>
                    <Input
                      type="date"
                      value={request.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequest((prev) => ({ ...prev, endDate: e.target.value }))}
                      disabled={request.durationType !== 'personnalise'}
                      classNames={{
                        input: 'h-12',
                      }}
                    />
                  </div>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Motif du congé</label>
                  <Input
                    placeholder="Veuillez saisir le motif"
                    value={request.reason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequest((prev) => ({ ...prev, reason: e.target.value }))}
                    classNames={{
                      input: 'h-12',
                    }}
                  />
                </div>

                {/* Status Selection - Only in edit mode */}
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Statut du congé</label>
                    <Select
                      placeholder="Sélectionnez le statut"
                      selectedKeys={[request.statut]}
                      onSelectionChange={(keys) => setRequest((prev) => ({ ...prev, statut: Array.from(keys)[0] as string }))}
                      classNames={{
                        trigger: 'h-12',
                      }}
                    >
                      <SelectItem key="EN_ATTENTE" value="EN_ATTENTE">
                        En attente
                      </SelectItem>
                      <SelectItem key="APPROUVEE" value="APPROUVEE">
                        Approuvée
                      </SelectItem>
                      <SelectItem key="EN_COURS" value="EN_COURS">
                        En cours
                      </SelectItem>
                      <SelectItem key="TERMINE" value="TERMINE">
                        Terminé
                      </SelectItem>
                      <SelectItem key="REJETEE" value="REJETEE">
                        Rejetée
                      </SelectItem>
                    </Select>
                  </div>
                )}

                {/* Summary */}
                {request.duration > 0 && (
                  <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Résumé</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">{request.duration} jours de congé</span>
                      <span className="text-sm font-medium text-foreground">Solde restant après ce congé : {getRemainingBalance()} jours</span>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Annuler
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                {isEditMode ? 'Modifier la demande' : 'Créer la demande'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
