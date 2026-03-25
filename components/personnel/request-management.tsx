'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { toast } from 'react-toastify';
import { RequestTable } from './request-table';
import AutomatisationConges from './automation-conges';
import PlanningConges from './planning-conges';
import { IEmployee, LeaveRequest, RequestStats } from '@/features/personnel/types/types';
import { useAjouterCongeMutation, useApprouverCongeMutation, useModifierCongeMutation, useRejeterCongeMutation, useSupprimerCongeMutation } from '@/features/conge/mutations/conge.mutation';
import { CongeType, DurationType } from '@/features/conge/types/conge.type';
import { useEmployeeListQuery } from '@/features/personnel/queries';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialTabsList, MaterialTabsTrigger, Tabs, TabsContent } from '@/components/commons/tabs';
// Hook pour la modal de confirmation
const useConfirmDialog = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const openDialog = (msg: string, confirmCallback: () => void) => {
    setMessage(msg);
    setOnConfirm(() => confirmCallback);
    onOpen();
  };

  const confirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange();
  };

  const cancel = () => {
    onOpenChange();
  };

  return {
    isOpen,
    onOpen,
    onOpenChange,
    message,
    openDialog,
    confirm,
    cancel,
  };
};

interface RequestManagementProps {
  requests: LeaveRequest[];
  requestStats: RequestStats;
  employees: IEmployee[];
}

export function RequestManagement({ requests, requestStats, employees}: RequestManagementProps) {
  // Utiliser la mutation pour ajouter un congé
  const ajouterCongeMutation = useAjouterCongeMutation();

  // Utiliser la mutation pour supprimer un congé
  const supprimerCongeMutation = useSupprimerCongeMutation();

  // Utiliser la mutation pour modifier un congé
  const modifierCongeMutation = useModifierCongeMutation();

  // Utiliser la mutation pour approuver un congé
  const approuverCongeMutation = useApprouverCongeMutation();

  // Utiliser la mutation pour rejeter un congé
  const rejeterCongeMutation = useRejeterCongeMutation();

  // Initialiser le query client pour invalider les queries
  const queryClient = useQueryClient();

  // Hook pour la modal de confirmation
  const { isOpen, onOpenChange, message, openDialog, confirm, cancel } = useConfirmDialog();

  // Modal pour nouvelle/modification de demande
  const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormOpenChange } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  // Récupérer la liste des employés depuis l'API
  const { data: employeesData } = useEmployeeListQuery({});
  console.log('Employés data:', employeesData);

  // Utiliser les données de l'API si disponibles, sinon les données mockées
  const displayEmployees = employeesData?.content || employees;
  const [newRequest, setNewRequest] = useState({
    employeeId: '',
    employeeName: '',
    type: 'ANNUEL' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    duration: 0,
    durationType: 'mois',
    reason: '',
  });

  const [leaveBalance, ] = useState(30);
  const [eligibilityDate, ] = useState('15/06/2024');

  const handleSubmitRequest = () => {
    console.log('handleSubmitRequest - newRequest:', newRequest);

    if (!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Préparer les données pour l'API
    const employee = displayEmployees.find((emp) => emp.id === newRequest.employeeId);

    // Mapper les types manuellement pour la création
    let typeValue: CongeType;
    let durationTypeValue: DurationType;

    switch (newRequest.type) {
      case 'annuel':
        typeValue = CongeType.ANNUEL;
        break;
      case 'maladie':
        typeValue = CongeType.MALADIE;
        break;
      case 'MATERNITE':
        typeValue = CongeType.MATERNITE;
        break;
      default:
        typeValue = CongeType.SANS_SOLDE;
    }

    switch (newRequest.durationType) {
      case 'mois':
        durationTypeValue = DurationType.MOIS;
        break;
      case 'quinzaine':
        durationTypeValue = DurationType.QUINZAINE;
        break;
      case 'semaine':
        durationTypeValue = DurationType.SEMAINE;
        break;
      default:
        durationTypeValue = DurationType.PERSONNALISE;
    }

    const congeData = {
      employeeId: newRequest.employeeId,
      employeeName: employee?.name || '', // Utiliser le nom réel de l'employé
      type: typeValue, // Utiliser l'enum TypeScript
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      duration: calculateDuration(newRequest.startDate, newRequest.endDate),
      durationType: durationTypeValue, // Utiliser l'enum TypeScript
      reason: newRequest.reason,
      statut: 'EN_ATTENTE', // Utiliser EN_ATTENTE au lieu de EN_COURS
    };

    console.log("Données à envoyer à l'API:", congeData);

    if (isEditMode && editingRequestId) {
      // Mode modification : envoyer toutes les données comme le curl PUT
      const employee = displayEmployees.find((emp) => emp.id === newRequest.employeeId);

      // Mapper les types manuellement
      let typeValue: CongeType;
      let durationTypeValue: DurationType;

      switch (newRequest.type) {
        case 'ANNUEL':
          typeValue = CongeType.ANNUEL;
          break;
        case 'MALADIE':
          typeValue = CongeType.MALADIE;
          break;
        case 'MATERNITE':
          typeValue = CongeType.MATERNITE;
          break;
        case 'SANS_SOLDE':
          typeValue = CongeType.SANS_SOLDE;
          break;
        default:
          typeValue = CongeType.SANS_SOLDE;
      }

      switch (newRequest.durationType) {
        case 'mois':
          durationTypeValue = DurationType.MOIS;
          break;
        case 'quinzaine':
          durationTypeValue = DurationType.QUINZAINE;
          break;
        case 'semaine':
          durationTypeValue = DurationType.SEMAINE;
          break;
        default:
          durationTypeValue = DurationType.PERSONNALISE;
      }

      const updateData = {
        employeeId: newRequest.employeeId,
        employeeName: employee?.name || newRequest.employeeName || '',
        type: typeValue, // Utiliser l'enum TypeScript
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        duration: calculateDuration(newRequest.startDate, newRequest.endDate),
        durationType: durationTypeValue, // Utiliser l'enum TypeScript
        reason: newRequest.reason,
        statut: 'EN_COURS',
      };

      console.log('Données de modification PUT:', updateData);
      modifierCongeMutation.mutate({ id: editingRequestId, data: updateData });
    } else {
      // Mode création : utiliser la mutation d'ajout
      ajouterCongeMutation.mutate(congeData, {
        onSuccess: (data) => {
          console.log('✅ Succès - Données sauvegardées:', data);
          toast.success('Demande de congé créée avec succès');

          // Invalider les queries pour forcer le rechargement des données
          queryClient.invalidateQueries({ queryKey: ['conges'] });

          setNewRequest({
            employeeId: '',
            employeeName: '',
            type: 'annuel',
            startDate: '',
            endDate: '',
            duration: 0,
            durationType: 'mois',
            reason: '',
          });

          onFormOpenChange();
        },
      });
    }

    setIsEditMode(false);
    setEditingRequestId(null);
    onFormOpenChange();
  };

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays); // S'assurer que la durée est au moins 1 jour
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
        daysToAdd = newRequest.duration || 1;
        break;
    }

    const end = new Date(start);
    end.setDate(end.getDate() + daysToAdd);
    return end.toISOString().split('T')[0];
  };

  const handleDeleteRequest = (requestId: string) => {
    openDialog('Êtes-vous sûr de vouloir supprimer cette demande de congé ?', () => {
      supprimerCongeMutation.mutate(requestId);
    });
  };

  const handleApproveRequest = (requestId: string) => {
    approuverCongeMutation.mutate({
      id: requestId,
      data: { reason: 'Approuvé automatiquement' }, // Utiliser le champ reason au lieu de statut
    });
  };

  const handleRejectRequest = (requestId: string) => {
    rejeterCongeMutation.mutate({
      id: requestId,
      data: { reason: 'Rejeté automatiquement' },
    });
  };

  const handleEditRequest = (request: LeaveRequest) => {
    // Remplir le formulaire avec les données de la demande existante
    setNewRequest({
      employeeId: request.employeeId,
      employeeName: request.employeeName, // Garder le nom original
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      duration: request.duration,
      durationType: 'mois', // Par défaut, car LeaveRequest n'a pas de durationType
      reason: request.reason || '',
    });

    // Activer le mode édition
    setIsEditMode(true);
    setEditingRequestId(request.id);
    onFormOpen(); // Ouvrir le modal
  };

  const getRemainingBalance = (): number => {
    return Math.max(0, leaveBalance - newRequest.duration);
  };

  useEffect(() => {
    if (newRequest.startDate && newRequest.durationType !== 'personnalise') {
      const endDate = calculateEndDate(newRequest.startDate, newRequest.durationType);
      const duration = calculateDuration(newRequest.startDate, endDate);
      setNewRequest((prev) => ({
        ...prev,
        endDate,
        duration,
      }));
    }
  }, [newRequest.startDate, newRequest.durationType]);

  useEffect(() => {
    if (newRequest.durationType !== 'personnalise' && newRequest.durationType && !newRequest.startDate) {
      // Si aucune date de début n'est choisie, on met la date du jour par défaut
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(today, newRequest.durationType);
      const duration = calculateDuration(today, endDate);
      setNewRequest((prev) => ({
        ...prev,
        startDate: today,
        endDate,
        duration,
      }));
    }
  }, [newRequest.durationType]);

  useEffect(() => {
    if (newRequest.startDate && newRequest.endDate) {
      const duration = calculateDuration(newRequest.startDate, newRequest.endDate);
      setNewRequest((prev) => ({ ...prev, duration }));
    }
  }, [newRequest.startDate, newRequest.endDate]);

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    setNewRequest((prev) => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Demandes de congé</h2>
        <Button color="primary" onPress={onFormOpen}>
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
      <div className=" flex justify-end">
        <Tabs defaultValue="conge" className="w-full">
          <MaterialTabsList className="grid max-w-2xl grid-cols-4 rounded-full">
            <MaterialTabsTrigger value="conge">Congé</MaterialTabsTrigger>
            <MaterialTabsTrigger value="employe">Employé</MaterialTabsTrigger>
            <MaterialTabsTrigger value="planning-calendrier">Planning Calendrier</MaterialTabsTrigger>
          </MaterialTabsList>

          <TabsContent value="conge" className="mt-6">
            {/* Tableau des demandes */}
            <RequestTable requests={requests} onApproveRequest={handleApproveRequest} onRejectRequest={handleRejectRequest} onDeleteRequest={handleDeleteRequest} onEditRequest={handleEditRequest} />
          </TabsContent>
          <TabsContent value="employe" className="mt-6">
            <AutomatisationConges />
          </TabsContent>
          <TabsContent value="planning-calendrier" className="mt-6">
            <PlanningConges />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de confirmation */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Confirmation</ModalHeader>
          <ModalBody>{message}</ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={cancel}>
              Annuler
            </Button>
            <Button color="primary" onPress={confirm}>
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal nouvelle demande */}
      <Modal isOpen={isFormOpen} onOpenChange={onFormOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{isEditMode ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'}</ModalHeader>
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
                        trigger: 'h-12',
                      }}
                    >
                      {displayEmployees.map((employee) => (
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de congé</label>
                    <Select
                      placeholder="Sélectionnez le type"
                      selectedKeys={[newRequest.type]}
                      onSelectionChange={(keys) => setNewRequest((prev) => ({ ...prev, type: Array.from(keys)[0] as LeaveRequest['type'] }))}
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
                      <SelectItem key="MATERNITE" value="MATERNITE">Congé maternité</SelectItem>
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
                        onPress={() => setNewRequest((prev) => ({ ...prev, durationType: 'mois' }))}
                        className="h-12 text-xs"
                      >
                        Mois (30j)
                      </Button>
                      <Button
                        variant={newRequest.durationType === 'quinzaine' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'quinzaine' ? 'primary' : 'default'}
                        size="sm"
                        onPress={() => setNewRequest((prev) => ({ ...prev, durationType: 'quinzaine' }))}
                        className="h-12 text-xs"
                      >
                        Quinzaine (15j)
                      </Button>
                      <Button
                        variant={newRequest.durationType === 'semaine' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'semaine' ? 'primary' : 'default'}
                        size="sm"
                        onPress={() => setNewRequest((prev) => ({ ...prev, durationType: 'semaine' }))}
                        className="h-12 text-xs"
                      >
                        Semaine (7j)
                      </Button>
                      <Button
                        variant={newRequest.durationType === 'personnalise' ? 'solid' : 'bordered'}
                        color={newRequest.durationType === 'personnalise' ? 'primary' : 'default'}
                        size="sm"
                        onPress={() => setNewRequest((prev) => ({ ...prev, durationType: 'personnalise' }))}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest((prev) => ({ ...prev, startDate: e.target.value }))}
                        classNames={{
                          input: 'h-12',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                      <Input
                        type="date"
                        value={newRequest.endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest((prev) => ({ ...prev, endDate: e.target.value }))}
                        disabled={newRequest.durationType !== 'personnalise'}
                        classNames={{
                          input: 'h-12',
                        }}
                      />
                    </div>
                  </div>

                  {/* Reason Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motif du congé</label>
                    <Input
                      placeholder="Veuillez saisir le motif"
                      value={newRequest.reason}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequest((prev) => ({ ...prev, reason: e.target.value }))}
                      classNames={{
                        input: 'h-12',
                      }}
                    />
                  </div>

                  {/* Summary */}
                  {newRequest.duration > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Résumé</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{newRequest.duration} jours de congé</span>
                        <span className="text-sm font-medium text-gray-800">Solde restant après ce congé : {getRemainingBalance()} jours</span>
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
                  {isEditMode ? 'Modifier la demande' : 'Créer la demande'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
