'use client';

import React from 'react';
import { Button, Card, Chip, Modal, Spinner } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { IContestation } from '@/features/recouvrements/types';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
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

  /*
   * La carte etait peinte en `bg-red-50 hover:bg-red-100` (active), `bg-green-50`
   * (resolue) et `bg-blue-50` (autre) — six teintes de la palette Tailwind, dont trois
   * fonds pleins qui n'ont aucune variante sombre : en theme sombre, du texte clair sur
   * un fond rose pale. Seul le lisere reste, dans le ton du statut, parce que c'est lui
   * qui distingue une contestation ACTIVE — la seule qui appelle un geste.
   */
  const liseréStatut = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'border-l-4 border-l-danger';
      case 'RESOLUE':
        return 'border-l-4 border-l-success';
      default:
        return 'border-l-4 border-l-separator';
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
      <Card className={cn(liseréStatut(contestation.statut))}>
        <Card.Content className="gap-3">
          {/* En-tête avec statut */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-sm font-semibold text-muted">Facture</p>
              <p className="text-lg font-bold text-foreground">{contestation.facture?.code}</p>
            </div>
            <Chip color={getStatusColor(contestation.statut)} size="sm" variant="soft">
              <Chip.Label>{getStatusLabel(contestation.statut)}</Chip.Label>
            </Chip>
          </div>

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
              <p className="text-sm font-bold tabular-nums text-foreground">
                {new Intl.NumberFormat('fr-FR', { currency: 'XOF', style: 'currency' }).format(
                  contestation.facture.montant,
                )}
              </p>
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
            <Button
              aria-label="Voir les détails de la contestation"
              isIconOnly
              onPress={() => setIsOpen(true)}
              size="sm"
              variant="secondary"
            >
              <BookOpen aria-hidden="true" className="size-4" />
            </Button>
            <FacturePdfViewer factureId={contestation.facture?.id || ''} />
            {contestation.statut === 'ACTIVE' && (
              <Button
                className="flex-1"
                isPending={isResolving}
                onPress={handleResolveContestations}
                size="sm"
                variant="primary"
              >
                {isResolving ? <Spinner size="sm" /> : <CheckCircle aria-hidden="true" className="size-4" />}
                Résoudre
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Modal pour voir les détails complets */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>
                <Modal.Heading className="flex flex-1 items-center justify-between gap-2">
                  <span>Détails de la contestation</span>
                  <Chip color={getStatusColor(contestation.statut)} size="sm" variant="soft">
                    <Chip.Label>{getStatusLabel(contestation.statut)}</Chip.Label>
                  </Chip>
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4">
                {/* Informations facture */}
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">Informations de la facture</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted">Code facture</p>
                      <p className="font-semibold text-foreground">{contestation.facture?.code}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted">Restaurant</p>
                      <p className="font-semibold text-foreground">
                        {contestation.facture?.restaurantName}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-muted">Montant</p>
                      <p className="font-bold tabular-nums text-foreground">
                        {new Intl.NumberFormat('fr-FR', { currency: 'XOF', style: 'currency' }).format(
                          contestation.facture?.montant || 0,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-muted">Période</p>
                      <p className="text-xs text-foreground">
                        {format(new Date(contestation.facture?.periodeDebut || ''), 'dd MMM yyyy', {
                          locale: fr,
                        })}{' '}
                        au{' '}
                        {format(new Date(contestation.facture?.periodeFin || ''), 'dd MMM yyyy', {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description complète */}
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">
                    Description de la contestation
                  </h4>
                  <div className="rounded-lg border border-separator bg-surface-secondary p-4">
                    <p className="whitespace-pre-wrap text-foreground">{contestation.description}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 border-t border-separator pt-4 text-sm">
                  <div>
                    <p className="font-medium text-muted">Date de contestation</p>
                    <p className="text-foreground">
                      {format(new Date(contestation.createdAt), 'dd MMMM yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button onPress={() => setIsOpen(false)} variant="ghost">
                  Fermer
                </Button>
                {contestation.statut === 'ACTIVE' && (
                  <Button
                    isPending={isResolving}
                    onPress={() => {
                      resolveContestation(contestation.id, {
                        onSuccess: () => {
                          onResolve?.();
                          setIsOpen(false);
                        },
                      });
                    }}
                    variant="primary"
                  >
                    {isResolving ? <Spinner size="sm" /> : null}
                    Résoudre la contestation
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
