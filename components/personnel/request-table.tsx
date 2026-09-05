'use client';

import { Avatar, Button, Card, Chip, Modal, Table } from '@heroui-v3/react';
import { Check, Clock, Pencil, RotateCw, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  PersonnelMobileCard,
  PersonnelMobileCardList,
} from '@/components/personnel/shared/personnel-mobile-card';

import { useCongesQuery } from '../../features/conge/queries/conge.query';
import { IConge } from '../../features/conge/types/conge.type';
import { LeaveRequest } from '../../features/personnel/types/types';

interface RequestTableProps {
  onApproveRequest: (requestId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onEditRequest: (request: LeaveRequest) => void;
  onRejectRequest: (requestId: string) => void;
  requests: LeaveRequest[];
}

type TonStatut = 'danger' | 'default' | 'success';

/**
 * L'état d'une demande de congé.
 *
 * <h3>Ce qui change</h3>
 * <p>Le statut était une pastille PLEINE et saturée — `bg-green-600 text-white`,
 * `bg-red-600`, `bg-yellow-500` — précédée d'un ÉMOJI : ⏳ ✅ ❌ 🔄 ✨. Un émoji n'est
 * pas une icône : il est rendu par la police du système, change de dessin d'un poste à
 * l'autre, et les lecteurs d'écran l'annoncent avec son nom Unicode complet — « sablier
 * qui s'écoule » avant chaque « En attente ». L'icône vient maintenant du jeu du projet
 * et est masquée aux lecteurs d'écran, qui lisent le libellé.</p>
 *
 * <p>« En attente » perd sa couleur : c'est l'état NORMAL d'une demande qu'on vient de
 * déposer. Ce qui appelle un geste est dit par le bouton « Actions » de la ligne.</p>
 */
const ETATS: Record<string, { icone: typeof Clock; libelle: string; ton: TonStatut }> = {
  APPROUVEE: { icone: Check, libelle: 'Demande approuvée', ton: 'success' },
  EN_ATTENTE: { icone: Clock, libelle: 'En attente de validation', ton: 'default' },
  EN_COURS: { icone: RotateCw, libelle: 'Congé en cours', ton: 'default' },
  REJETEE: { icone: X, libelle: 'Demande rejetée', ton: 'danger' },
  TERMINE: { icone: Check, libelle: 'Congé terminé', ton: 'default' },
};

/** Le backend écrit tantôt « EN_ATTENTE », tantôt « En attente ». */
function cleEtat(statut: string): string {
  return (statut ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

function ChipStatutConge({ statut }: { statut: string }) {
  const etat = ETATS[cleEtat(statut)];
  const Icone = etat?.icone ?? Clock;
  return (
    <Chip color={etat?.ton ?? 'default'} size="sm" variant="soft">
      <Icone aria-hidden="true" className="size-3" />
      <Chip.Label className="whitespace-nowrap">{statut}</Chip.Label>
    </Chip>
  );
}

const LIBELLES_TYPE: Record<string, string> = {
  ANNUEL: 'Congé annuel',
  MALADIE: 'Congé maladie',
  MATERNITE: 'Congé maternité',
  SANS_SOLDE: 'Congé sans solde',
};

/**
 * Le TYPE de congé ne porte plus de couleur.
 *
 * <p>Annuel en bleu, maladie en rouge, sans solde en orange, maternité en violet :
 * quatre pastilles pleines de la palette Tailwind pour une CATÉGORIE. Un congé maladie
 * n'est pas une erreur — le rouge le laissait entendre à chaque ligne.</p>
 */
function ChipTypeConge({ type }: { type: string }) {
  const cle = cleEtat(type);
  return (
    <Chip size="sm" variant="soft">
      <Chip.Label className="whitespace-nowrap">{LIBELLES_TYPE[cle] ?? type}</Chip.Label>
    </Chip>
  );
}

const COLONNES = ['Employé', 'Type', 'Période', 'Durée', 'Motif', 'Statut', 'Actions'] as const;

export function RequestTable({
  onApproveRequest,
  onDeleteRequest,
  onEditRequest,
  onRejectRequest,
  requests,
}: RequestTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<IConge | LeaveRequest | null>(null);

  // Le filtre EN_ATTENTE reste desactive : le tableau liste donc tous les statuts, et son
  // etat vide ne peut pas parler d'attente sans mentir sur ce qui est affiche.
  const {
    data: congesData,
    error: congesError,
    isFetching: congesFetching,
    isLoading: congesLoading,
    refetch: refetchConges,
  } = useCongesQuery({});

  // Utiliser les données de l'API si disponibles, sinon les données mockées
  const displayRequests = congesData?.content || requests;

  const canApprove = (statut: string) => cleEtat(statut) === 'EN_ATTENTE';
  const canReject = (statut: string) => cleEtat(statut) === 'EN_ATTENTE';

  const handleModalAction = (action: 'approve' | 'delete' | 'edit' | 'reject') => {
    if (!selectedRequest) return;
    if (action === 'edit') onEditRequest(selectedRequest as LeaveRequest);
    if (action === 'approve') onApproveRequest(selectedRequest.id);
    if (action === 'reject') onRejectRequest(selectedRequest.id);
    if (action === 'delete') onDeleteRequest(selectedRequest.id);
    setSelectedRequest(null);
  };

  const initiales = (name: string) => {
    const parts = (name ?? '').split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name ?? '').substring(0, 2).toUpperCase();
  };

  /*
   * L'avatar etait un `<div className="rounded-full bg-blue-500 text-white">` recopie a
   * trois endroits — tableau, carte tactile, fenetre — dans trois tailles differentes.
   */
  const avatar = (nom: string, taille: 'lg' | 'md' | 'sm' = 'md') => (
    <Avatar size={taille}>
      <Avatar.Fallback>{initiales(nom)}</Avatar.Fallback>
    </Avatar>
  );

  if (congesLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="h-14 animate-pulse rounded-xl bg-surface-secondary" key={i} />
        ))}
      </div>
    );
  }

  // Afficher les erreurs. Le message technique reste, mais en second plan : ce que
  // l'operateur attend d'abord, c'est de pouvoir relancer.
  if (congesError) {
    return (
      <EtatErreur
        detail={congesError instanceof Error ? congesError.message : undefined}
        enCours={congesFetching}
        onReessayer={() => refetchConges()}
        quoi="les demandes de congé"
      />
    );
  }

  const aucune = !displayRequests || displayRequests.length === 0;

  return (
    <>
      {/* Tableau — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Liste des demandes" className="min-w-[64rem]">
                <Table.Header>
                  {COLONNES.map((c) => (
                    <Table.Column id={c} isRowHeader={c === 'Employé'} key={c}>
                      {c}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="py-8 text-center text-sm text-muted">Aucune demande de congé</p>
                  )}
                >
                  {(aucune ? [] : displayRequests).map((request: IConge | LeaveRequest) => (
                    <Table.Row id={request.id} key={request.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {avatar(request.employeeName)}
                          <div>
                            <div className="font-medium text-foreground">
                              {request.employeeName}
                            </div>
                            <div className="text-sm text-muted">
                              Demande créée le{' '}
                              {new Date(
                                request.createdAt || request.startDate,
                              ).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <ChipTypeConge type={request.type} />
                      </Table.Cell>
                      <Table.Cell>
                        <div className="text-sm">
                          <div>{request.startDate}</div>
                          <div>{request.endDate}</div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{request.duration} jours</Table.Cell>
                      <Table.Cell>
                        <div className="max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <ChipStatutConge statut={request.statut} />
                      </Table.Cell>
                      <Table.Cell>
                        <Button onPress={() => setSelectedRequest(request)} size="sm" variant="outline">
                          Actions
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <PersonnelMobileCardList>
        {aucune ? (
          <p className="py-10 text-center text-sm text-muted">Aucune demande de congé</p>
        ) : (
          displayRequests.map((request: IConge | LeaveRequest) => (
            <PersonnelMobileCard
              actions={
                <Button
                  className="w-full"
                  onPress={() => setSelectedRequest(request)}
                  variant="outline"
                >
                  Actions
                </Button>
              }
              fields={[
                { label: 'Type', value: <ChipTypeConge type={request.type} /> },
                { label: 'Période', value: `${request.startDate} - ${request.endDate}` },
                { label: 'Durée', value: `${request.duration} jours` },
                { label: 'Motif', value: request.reason || '-' },
              ]}
              key={request.id}
              statut={<ChipStatutConge statut={request.statut} />}
              subtitle={`Demande créée le ${new Date(
                request.createdAt || request.startDate,
              ).toLocaleDateString('fr-FR')}`}
              title={
                <span className="flex items-center gap-2">
                  {avatar(request.employeeName, 'sm')}
                  {request.employeeName}
                </span>
              }
            />
          ))
        )}
      </PersonnelMobileCardList>

      {/* Fenêtre d'actions */}
      <Modal
        isOpen={Boolean(selectedRequest)}
        onOpenChange={(o) => !o && setSelectedRequest(null)}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-2xl">
              <Modal.Header>
                <Modal.Heading className="flex items-center gap-3">
                  {selectedRequest ? avatar(selectedRequest.employeeName, 'lg') : null}
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold">Actions pour la demande</span>
                    <span className="text-sm font-normal text-muted">
                      {selectedRequest?.employeeName}
                    </span>
                  </span>
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                {selectedRequest && (
                  <>
                    <div className="rounded-lg bg-surface-secondary p-4">
                      <h4 className="mb-3 font-semibold text-foreground">Détails de la demande</h4>
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted">Type :</span>
                          <ChipTypeConge type={selectedRequest.type} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted">Statut :</span>
                          <ChipStatutConge statut={selectedRequest.statut} />
                        </div>
                        <div>
                          <span className="text-muted">Période :</span>
                          <span className="ml-2">
                            {selectedRequest.startDate} - {selectedRequest.endDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Durée :</span>
                          <span className="ml-2">{selectedRequest.duration} jours</span>
                        </div>
                      </div>
                      {selectedRequest.reason && (
                        <div className="mt-3">
                          <span className="text-muted">Motif :</span>
                          <p className="mt-1 text-sm">{selectedRequest.reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="font-semibold text-foreground">Actions disponibles</h4>
                      {/*
                       * Les quatre boutons portaient un emoji chacun — ✏️ ✅ ❌ 🗑️ — et
                       * quatre couleurs pleines. Seuls le rejet et la suppression defont
                       * quelque chose : eux seuls restent rouges.
                       */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button
                          className="w-full"
                          onPress={() => handleModalAction('edit')}
                          variant="outline"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                          Modifier la demande
                        </Button>
                        <Button
                          className="w-full"
                          isDisabled={!canApprove(selectedRequest.statut)}
                          onPress={() => handleModalAction('approve')}
                          variant="primary"
                        >
                          <Check aria-hidden="true" className="size-4" />
                          Approuver
                        </Button>
                        <Button
                          className="w-full"
                          isDisabled={!canReject(selectedRequest.statut)}
                          onPress={() => handleModalAction('reject')}
                          variant="danger-soft"
                        >
                          <X aria-hidden="true" className="size-4" />
                          Rejeter
                        </Button>
                        <Button
                          className="w-full"
                          onPress={() => handleModalAction('delete')}
                          variant="danger-soft"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setSelectedRequest(null)} variant="ghost">
                  Fermer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
