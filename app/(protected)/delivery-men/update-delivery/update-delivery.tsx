import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/heroui';
import { SelectField } from '@/components/commons/form/select-field';
import { LivreurStatutVM, Restaurant } from '@/types/models';
import { useUpdateDeliveryManController } from './controler';

interface Props {
  restaurants: Restaurant[] | null;
  isOpen: boolean;
  onClose: () => void;
  livreur?: LivreurStatutVM | null;
  nomLivreur?: string;
  typeLiveur?: string;
  isReassign?: boolean;
  title?: string;
  onSuccess?: () => void;
}
export function UpdateDeliveryDialog({ restaurants, isOpen, onClose, livreur, typeLiveur, isReassign, title, onSuccess }: Props) {
  const ctrl = useUpdateDeliveryManController(livreur, typeLiveur, onClose, isReassign, onSuccess);
  const headerTitle = title ?? (isReassign ? 'Réassigner le livreur' : 'Changer le statut du livreur');
  return (
    <>
      <Modal isOpen={isOpen} size={'md'} onClose={onClose}>
        <ModalContent>
          <>
            <ModalHeader className="flex gap-2">
              {headerTitle} : <b className="text-primary">{livreur?.nomPrenom}</b>
            </ModalHeader>
            <ModalBody>
              <div className="">
                <SelectField options={restaurants || []} value={ctrl.restaurantSelected} setValue={ctrl.setRestuarantSelect} label="nomEtablissement" placeholder="Selectionnée un restaurant" />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} size="sm">
                Annuler
              </Button>
              <Button color="primary" onPress={ctrl.changerRestaurantLivreurs} size="sm">
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
