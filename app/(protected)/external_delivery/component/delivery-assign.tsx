'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@/components/heroui';
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
    <Modal isOpen={open} onOpenChange={setOpen} placement="center">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <BikeIcon className="w-5 h-5 text-primary" />
                Assigner la course {delivery.code ? `· ${delivery.code}` : ''}
              </span>
              <span className="text-xs font-normal text-muted">
                Le livreur sélectionné reçoit la course immédiatement dans son application.
              </span>
            </ModalHeader>
            <ModalBody>
              <Select
                label="Livreur"
                placeholder="Choisir un livreur disponible"
                variant="bordered"
                selectedKeys={livreurId ? [livreurId] : []}
                onSelectionChange={(keys) => setLivreurId(Array.from(keys as Set<string>)[0] ?? '')}
                items={delivers}
              >
                {(l) => (
                  <SelectItem key={l.livreurId} textValue={`${l.nomComplet} — ${l.telephone}`}>
                    <div className="flex items-center gap-3">
                      <Avatar src={l.avatarUrl || undefined} name={l.nomComplet?.[0] ?? '?'} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{l.nomComplet}</span>
                        <span className="text-xs text-muted">{l.telephone}</span>
                      </div>
                    </div>
                  </SelectItem>
                )}
              </Select>
              {delivers.length === 0 && (
                <p className="text-xs text-amber-600">Aucun livreur disponible pour le moment.</p>
              )}

              <Input
                label="Frais de livraison (XOF)"
                type="number"
                min={0}
                variant="bordered"
                value={frais}
                onValueChange={setFrais}
                placeholder="Ex. : 1500"
              />
              {fraisResolus > 0 && (
                <p className="flex items-start gap-1.5 text-xs text-muted">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  Frais résolus automatiquement depuis la grille tarifaire du partenaire :{' '}
                  <b>{fmtXof(fraisResolus)}</b>. Ils restent appliqués aux commandes de cette course.
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close} isDisabled={pending}>
                Annuler
              </Button>
              <Button color="primary" onPress={() => handleSubmit(close)} isLoading={pending} isDisabled={!livreurId}>
                Assigner
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
