'use client';

import { useState } from 'react';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { LeaveRequest } from '../../features/personnel/types/types';
import { IConge, CongeStatut } from '../../features/conge/types/conge.type';
import { useCongesQuery } from '../../features/conge/queries/conge.query';

interface RequestTableProps {
  requests: LeaveRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onEditRequest: (request: LeaveRequest) => void;
}

export function RequestTable({ requests, onApproveRequest, onRejectRequest, onDeleteRequest, onEditRequest }: RequestTableProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | IConge | null>(null);
  
  // Utiliser le hook pour récupérer les demandes de congés
  const { data: congesData, isLoading: congesLoading, error: congesError } = useCongesQuery({
    // statut: CongeStatut.EN_ATTENTE // Filtrer les demandes en attente
  });
  
  console.log("=== REQUEST TABLE DEBUG ===");
  console.log("congesData:", congesData);
  console.log("congesData?.content:", congesData?.content);
  console.log("isLoading:", congesLoading);
  console.log("error:", congesError);
  
  // Utiliser les données de l'API si disponibles, sinon les données mockées
  const displayRequests = congesData?.content || requests;
  console.log("displayRequests:", displayRequests);
  console.log("displayRequests length:", displayRequests?.length);
  
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En attente': 
      case 'EN_ATTENTE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Approuvée': 
      case 'APPROUVEE':
        return 'bg-green-600 text-white border-green-300';
      case 'Rejetée': 
      case 'REJETEE':
        return 'bg-red-600 text-white border-red-300';
      case 'En cours': 
      case 'EN_COURS':
        return 'bg-yellow-500 text-white border-yellow-200';
      case 'Terminé': 
      case 'TERMINE':
        return 'bg-green-600 text-white border-green-300';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'En attente': 
      case 'EN_ATTENTE':
        return '⏳';
      case 'Approuvée': 
      case 'APPROUVEE':
        return '✅';
      case 'Rejetée': 
      case 'REJETEE':
        return '❌';
      case 'En cours': 
      case 'EN_COURS':
        return '🔄';
      case 'Terminé': 
      case 'TERMINE':
        return '✨';
      default: 
        return '📋';
    }
  };

  const getStatusDescription = (statut: string) => {
    switch (statut) {
      case 'En attente': 
      case 'EN_ATTENTE':
        return 'En attente de validation';
      case 'Approuvée': 
      case 'APPROUVEE':
        return 'Demande approuvée';
      case 'Rejetée': 
      case 'REJETEE':
        return 'Demande rejetée';
      case 'En cours': 
      case 'EN_COURS':
        return 'Congé en cours';
      case 'Terminé': 
      case 'TERMINE':
        return 'Congé terminé';
      default: 
        return 'Statut inconnu';
    }
  };

  const canApprove = (statut: string) => {
    return statut === 'En attente' || statut === 'EN_ATTENTE';
  };

  const canReject = (statut: string) => {
    return statut === 'En attente' || statut === 'EN_ATTENTE';
  };

  const canEdit = (statut: string) => {
    return true; // Modification toujours disponible
  };

  const canDelete = (statut: string) => {
    return true; // Suppression toujours disponible
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annuel': 
      case 'ANNUEL': 
        return 'bg-blue-600 text-white border-blue-300';
      case 'maladie': 
      case 'MALADIE': 
        return 'bg-red-600 text-white border-red-300';
      case 'sans solde': 
      case 'SANS_SOLDE': 
        return 'bg-orange-500 text-white border-orange-200';
      case 'maternite': 
      case 'MATERNITE': 
      case 'maternité': 
      case 'MATERNITÉ': 
        return 'bg-purple-600 text-white border-purple-300';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annuel': 
      case 'ANNUEL': 
        return 'Congé annuel';
      case 'maladie': 
      case 'MALADIE': 
        return 'Congé maladie';
      case 'sans solde': 
      case 'SANS_SOLDE': 
        return 'Congé sans solde';
      case 'maternite': 
      case 'MATERNITE': 
      case 'maternité': 
      case 'MATERNITÉ': 
        return 'Congé maternité';
      default: 
        return type;
    }
  };

  const handleActionClick = (request: LeaveRequest | IConge) => {
    setSelectedRequest(request);
    onOpen();
  };

  const handleModalAction = (action: string) => {
    if (!selectedRequest) return;
    
    switch (action) {
      case 'edit':
        onEditRequest(selectedRequest);
        break;
      case 'approve':
        onApproveRequest(selectedRequest.id);
        break;
      case 'reject':
        onRejectRequest(selectedRequest.id);
        break;
      case 'delete':
        onDeleteRequest(selectedRequest.id);
        break;
    }
    onOpenChange();
  };

  const getEmployeeInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Afficher l'état de chargement
  if (congesLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Chargement des demandes...</div>
      </div>
    );
  }

  // Afficher les erreurs
  if (congesError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">Erreur lors du chargement des demandes</div>
        <div className="text-sm text-gray-500 mt-2">
          {congesError instanceof Error ? congesError.message : 'Erreur inconnue'}
        </div>
      </div>
    );
  }

  return (
    <>
      <Table aria-label="Liste des demandes">
      <TableHeader>
        <TableColumn>EMPLOYÉ</TableColumn>
        <TableColumn>TYPE</TableColumn>
        <TableColumn>PÉRIODE</TableColumn>
        <TableColumn>DURÉE</TableColumn>
        <TableColumn>MOTIF</TableColumn>
        <TableColumn>STATUT</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {displayRequests && displayRequests.length > 0 ? (
          displayRequests.map((request: LeaveRequest | IConge) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                    {getEmployeeInitials(request.employeeName)}
                  </div>
                  <div>
                    <div className="font-medium">{request.employeeName}</div>
                    <div className="text-sm text-gray-500">
                      Demande créée le {new Date(request.createdAt || request.startDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getLeaveTypeColor(request.type)}`}>
                  {getLeaveTypeLabel(request.type)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{request.startDate}</div>
                  <div>{request.endDate}</div>
                </div>
              </TableCell>
              <TableCell>{request.duration} jours</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={request.reason}>
                  {request.reason}
                </div>
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusColor(request.statut)}`}
                     title={getStatusDescription(request.statut)}>
                  <span className="text-xs">{getStatusIcon(request.statut)}</span>
                  {request.statut}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={() => handleActionClick(request)}
                  className="min-w-20"
                >
                  Actions
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              <div className="text-gray-500">
                {congesData ? 'Aucune demande en attente trouvée' : 'Chargement...'}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    {/* Modal d'actions */}
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                  {selectedRequest ? getEmployeeInitials(selectedRequest.employeeName) : ''}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Actions pour la demande</h3>
                  <p className="text-sm text-gray-600">
                    {selectedRequest ? selectedRequest.employeeName : ''}
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              {selectedRequest && (
                <div className="space-y-4">
                  {/* Détails de la demande */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Détails de la demande</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Type :</span>
                        <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ml-2 ${getLeaveTypeColor(selectedRequest.type)}`}>
                          {getLeaveTypeLabel(selectedRequest.type)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Statut :</span>
                        <div className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ml-2 ${getStatusColor(selectedRequest.statut)}`}
                             title={getStatusDescription(selectedRequest.statut)}>
                          <span className="text-xs">{getStatusIcon(selectedRequest.statut)}</span>
                          {selectedRequest.statut}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Période :</span>
                        <span className="ml-2">{selectedRequest.startDate} - {selectedRequest.endDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Durée :</span>
                        <span className="ml-2">{selectedRequest.duration} jours</span>
                      </div>
                    </div>
                    {selectedRequest.reason && (
                      <div className="mt-3">
                        <span className="text-gray-600">Motif :</span>
                        <p className="mt-1 text-sm">{selectedRequest.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions disponibles */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Actions disponibles</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => handleModalAction('edit')}
                        isDisabled={!canEdit(selectedRequest.statut)}
                        className="w-full"
                      >
                        ✏️ Modifier la demande
                      </Button>
                      <Button
                        color="success"
                        variant="flat"
                        onPress={() => handleModalAction('approve')}
                        isDisabled={!canApprove(selectedRequest.statut)}
                        className="w-full"
                      >
                        ✅ Approuver
                      </Button>
                      <Button
                        color="danger"
                        variant="flat"
                        onPress={() => handleModalAction('reject')}
                        isDisabled={!canReject(selectedRequest.statut)}
                        className="w-full"
                      >
                        ❌ Rejeter
                      </Button>
                      <Button
                        color="default"
                        variant="flat"
                        onPress={() => handleModalAction('delete')}
                        isDisabled={!canDelete(selectedRequest.statut)}
                        className="w-full"
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  </div>

                  {/* Informations sur les permissions */}
                  {!canEdit(selectedRequest.statut) && !canApprove(selectedRequest.statut) && !canReject(selectedRequest.statut) && !canDelete(selectedRequest.statut) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Aucune action n'est disponible pour ce statut. La demande est probablement déjà en cours ou terminée.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="flat"
                onPress={onClose}
              >
                Fermer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  </>
  );
}
