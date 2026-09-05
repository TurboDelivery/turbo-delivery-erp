'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, Button, ComboBox, Input, Label, ListBox, Modal } from '@heroui-v3/react';

import { ChampMontant } from '@/components/commons/champs-formulaire';
import { BikeIcon, Info } from 'lucide-react';

import { CourseExterne, CourseExterneDetail, LivreurDisponible } from '@/types/models';
import { assignCourseExterne } from '@/src/actions/courses.actions';
import { fmtXof } from './course-statut';

interface Props {
  delivery: CourseExterne | CourseExterneDetail;
  delivers: LivreurDisponible[];
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Appelé après une assignation réussie (en plus du router.refresh). */
  onAssigned?: () => void;
}

/**
 * Assignation d'un livreur à une course externe. Les frais sont pré-remplis avec
 * les frais déjà résolus par zone sur les commandes (le backend les conserve pour
 * les commandes qui ont un statut) ; le champ reste modifiable pour les cas manuels.
 */
export default function DeliveryAssign({ delivery, delivers, open, setOpen, onAssigned }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [livreurId, setLivreurId] = useState('');
  const [frais, setFrais] = useState('');

  const fraisResolus = useMemo(
    () => (delivery.commandes ?? []).reduce((sum, c) => sum + (c.fraisLivraison ?? 0), 0),
    [delivery.commandes],
  );

  useEffect(() => {
    if (open) {
      setLivreurId('');
      setFrais(fraisResolus > 0 ? String(fraisResolus) : '');
    }
  }, [open, fraisResolus]);

  async function handleSubmit(close: () => void) {
    if (!livreurId) {
      toast.error('Veuillez sélectionner un livreur');
      return;
    }
    const montant = Number(frais);
    if (!frais || isNaN(montant) || montant <= 0) {
      toast.error('Veuillez entrer des frais de livraison valides');
      return;
    }
    setPending(true);
    try {
      const result = await assignCourseExterne(delivery.id, livreurId, montant);
      if (result.status === 'success') {
        toast.success('Course assignée — le livreur est notifié');
        router.refresh();
        onAssigned?.();
        close();
      } else {
        toast.error(result.message || "Erreur lors de l'assignation de la course");
      }
    } catch {
      toast.error("Une erreur est survenue lors de l'assignation");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={open} onOpenChange={setOpen}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <BikeIcon aria-hidden="true" className="size-5 text-muted" />
                  Assigner la course {delivery.code ? `· ${delivery.code}` : ''}
                </span>
                <span className="text-xs font-normal text-muted">
                  Le livreur sélectionné reçoit la course immédiatement dans son application.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              {/*
               * Une liste deroulante simple sur des dizaines de livreurs disponibles se
               * parcourt a la molette : elle se cherche.
               */}
              <ComboBox
                onSelectionChange={(k) => setLivreurId(k == null ? '' : String(k))}
                selectedKey={livreurId || null}
              >
                <Label>Livreur</Label>
                <ComboBox.InputGroup>
                  <Input placeholder="Choisir un livreur disponible" />
                  <ComboBox.Trigger />
                </ComboBox.InputGroup>
                <ComboBox.Popover>
                  <ListBox items={delivers}>
                    {(l: (typeof delivers)[number]) => (
                      <ListBox.Item
                        id={l.livreurId}
                        textValue={`${l.nomComplet} — ${l.telephone}`}
                      >
                        <span className="flex items-center gap-3">
                          <Avatar size="sm">
                            <Avatar.Image alt="" src={l.avatarUrl || undefined} />
                            <Avatar.Fallback>
                              {(l.nomComplet ?? '?').slice(0, 2).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <span className="flex flex-col">
                            <span className="text-sm font-medium">{l.nomComplet}</span>
                            <span className="text-xs text-muted">{l.telephone}</span>
                          </span>
                        </span>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    )}
                  </ListBox>
                </ComboBox.Popover>
              </ComboBox>
              {delivers.length === 0 && (
                <p className="text-xs text-warning-soft-foreground">
                  Aucun livreur disponible pour le moment.
                </p>
              )}

              <ChampMontant
                label="Frais de livraison (XOF)"
                onChange={(v) => setFrais(String(v))}
                valeur={frais === '' ? undefined : Number(frais)}
              />
              {fraisResolus > 0 && (
                <p className="flex items-start gap-1.5 text-xs text-muted">
                  <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  Frais résolus automatiquement depuis la grille tarifaire du partenaire :{' '}
                  <b>{fmtXof(fraisResolus)}</b>. Ils restent appliqués aux commandes de cette
                  course.
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button isDisabled={pending} onPress={() => setOpen(false)} variant="ghost">
                Annuler
              </Button>
              <Button
                isDisabled={!livreurId}
                isPending={pending}
                onPress={() => handleSubmit(() => setOpen(false))}
                variant="primary"
              >
                Assigner
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
