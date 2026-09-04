'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@/components/heroui';
import { IContestation } from '@/features/recouvrements/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import FacturePdfViewer from '@/components/finance/recouvrements/factures/pdf/facture-pdf-viewer';
import { BookOpen, CheckCircle } from 'lucide-react';
import { useResolveContestation } from '@/features/recouvrements/queries/contestation.mutation';

interface ContestationCardProps {
  contestation: IContestation;
  onResolve?: () => void;
}

export function ContestationCard({ contestation, onResolve }: ContestationCardProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { mutate: resolveContestation, isPending: isResolving } = useResolveContestation();

  const getStatusColor = (status: string): 'danger' | 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'ACTIVE':
        return 'danger';
      case 'RESOLUE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'RESOLUE':
        return 'Résolue';
      default:
        return status;
    }
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'border-l-4 border-l-red-500';
      case 'RESOLUE':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  const getCardBgColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-50 hover:bg-red-100';
      case 'RESOLUE':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  const handleResolveContestations = () => {
    resolveContestation(contestation.id, {
      onSuccess: () => {
        onResolve?.();
      },
    });
  };

  return (
    <>
      <Card className={`${getCardBorderColor(contestation.statut)} ${getCardBgColor(contestation.statut)} transition-all duration-200 cursor-pointer`}>
        <CardHeader className="pb-2 gap-2">
          {/* En-tête avec statut */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-sm font-semibold text-muted">Facture</p>
              <p className="text-lg font-bold text-foreground">{contestation.facture?.code}</p>
            </div>
            <Chip
              color={getStatusColor(contestation.statut)}
              size="sm"
              variant="flat"
              classNames={{
                content: 'text-xs font-semibold',
              }}
            >
              {getStatusLabel(contestation.statut)}
            </Chip>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Informations restaurant */}
          {contestation.facture && (
            <div>
              <p className="text-xs text-muted font-medium">Restaurant</p>
              <p className="text-sm font-semibold">{contestation.facture.restaurantName || 'N/A'}</p>
            </div>
          )}

          {/* Montant de la facture */}
          {contestation.facture?.montant && (
            <div>
              <p className="text-xs text-muted font-medium">Montant</p>
              <p className="text-sm font-bold text-blue-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(contestation.facture.montant)}</p>
            </div>
          )}

          {/* Description limitée */}
          <div>
            <p className="text-xs text-muted font-medium mb-1">Description</p>
            <p className="text-sm text-foreground line-clamp-2">{contestation.description}</p>
          </div>

          {/* Date de création */}
          <div className="pt-2 border-t border-separator">
            <p className="text-xs text-muted font-medium">Date de contestation</p>
            <p className="text-sm font-medium text-foreground">{format(new Date(contestation.createdAt), 'd MMMM yyyy', { locale: fr })}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button isIconOnly size="sm" variant="solid" color="secondary" onPress={onOpen} title="Voir les détails">
              <BookOpen className="size-4" />
            </Button>
            <FacturePdfViewer factureId={contestation.facture?.id || ''} />
            {contestation.statut === 'ACTIVE' && (
              <Button
                size="sm"
                variant="flat"
                color="success"
                onPress={handleResolveContestations}
                isLoading={isResolving}
                className="flex-1"
                startContent={!isResolving && <CheckCircle className="h-4 w-4" />}
              >
                Résoudre
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal pour voir les détails complets */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span>Détails de la contestation</span>
                  <Chip color={getStatusColor(contestation.statut)} size="sm" variant="flat">
                    {getStatusLabel(contestation.statut)}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody className="gap-4">
                {/* Informations facture */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Informations de la facture</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted font-medium">Code facture</p>
                      <p className="text-foreground font-semibold">{contestation.facture?.code}</p>
                    </div>
                    <div>
                      <p className="text-muted font-medium">Restaurant</p>
                      <p className="text-foreground font-semibold">{contestation.facture?.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-muted font-medium">Montant</p>
                      <p className="font-bold text-blue-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(contestation.facture?.montant || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted font-medium">Période</p>
                      <p className="text-foreground text-xs">
                        {format(new Date(contestation.facture?.periodeDebut || ''), 'dd MMM yyyy', { locale: fr })} au{' '}
                        {format(new Date(contestation.facture?.periodeFin || ''), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description complète */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Description de la contestation</h4>
                  <div className="bg-surface-secondary p-4 rounded-lg border border-separator">
                    <p className="text-foreground whitespace-pre-wrap">{contestation.description}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 text-sm border-t border-separator pt-4">
                  <div>
                    <p className="text-muted font-medium">Date de contestation</p>
                    <p className="text-foreground">{format(new Date(contestation.createdAt), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                {contestation.statut === 'ACTIVE' && (
                  <Button
                    color="success"
                    onPress={() => {
                      resolveContestation(contestation.id, {
                        onSuccess: () => {
                          onResolve?.();
                        },
                      });
                    }}
                    isLoading={isResolving}
                  >
                    Résoudre la contestation
                  </Button>
                )}
                <Button color="default" variant="light" onPress={onClose}>
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
