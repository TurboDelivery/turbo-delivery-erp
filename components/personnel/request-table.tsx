'use client';

import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
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
      case 'En attente': return 'warning';
      case 'Approuvée': return 'success';
      case 'Rejetée': return 'danger';
      default: return 'default';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annuel': return 'Congé annuel';
      case 'maladie': return 'Congé maladie';
      case 'sans solde': return 'Congé sans solde';
      default: return type;
    }
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
                <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                  request.type === 'annuel' ? 'bg-blue-600 text-white border-blue-300' :
                  request.type === 'maladie' ? 'bg-red-600 text-white border-red-300' :
                  request.type === 'sans solde' ? 'bg-yellow-500 text-white border-yellow-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
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
                <Badge color={getStatusColor(request.statut)}>
                  {request.statut}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => onEditRequest(request)}
                  >
                    Modifier
                  </Button>
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
                  <Button
                    size="sm"
                    color="default"
                    variant="flat"
                    onPress={() => onDeleteRequest(request.id)}
                  >
                    Supprimer
                  </Button>
                </div>
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
  );
}
