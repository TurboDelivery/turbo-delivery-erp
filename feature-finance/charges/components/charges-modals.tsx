'use client';

import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import ConfirmModal from '@/components/ui/confirm-modal';
import AddChargeFixeModal from './add-charge-fixe-modal';
import AddDepenseVariableModal from './add-depense-variable-modal';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';
import { useToggleEnableChargeFixeMutation, useSupprimerChargeFixeMutation } from '../queries/charge-fixe.mutation';

interface ChargesModalsProps {
  // Charge fixe
  isFixeModalOpen: boolean;
  onCloseFixeModal: () => void;
  chargeToEdit: IChargeFixe | null;
  // Charge variable
  isVariableModalOpen: boolean;
  onCloseVariableModal: () => void;
  chargeVariableToEdit: IChargeVariable | null;
  // Toggle
  toggleTarget: { charge: IChargeFixe; enable: boolean } | null;
  onCloseToggle: () => void;
  // Delete
  chargeToDelete: IChargeFixe | null;
  onCloseDelete: () => void;
  // Preview
  previewUrl: string | null;
  onClosePreview: () => void;
}

export function ChargesModals({
  isFixeModalOpen, onCloseFixeModal, chargeToEdit,
  isVariableModalOpen, onCloseVariableModal, chargeVariableToEdit,
  toggleTarget, onCloseToggle,
  chargeToDelete, onCloseDelete,
  previewUrl, onClosePreview,
}: ChargesModalsProps) {
  const toggleMutation = useToggleEnableChargeFixeMutation();
  const { mutate: supprimerChargeFixe, isPending: isDeleting } = useSupprimerChargeFixeMutation();

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  return (
    <>
      <AddChargeFixeModal isOpen={isFixeModalOpen} onClose={onCloseFixeModal} chargeToEdit={chargeToEdit} />
      <AddDepenseVariableModal isOpen={isVariableModalOpen} onClose={onCloseVariableModal} chargeToEdit={chargeVariableToEdit} />

      {/* Toggle Enable */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={onCloseToggle}
        title={`${toggleTarget?.enable ? 'Activer' : 'Désactiver'} la charge fixe`}
        isLoading={toggleMutation.isPending}
        actions={toggleTarget?.enable
          ? [
              { label: 'Annuler', variant: 'bordered', onPress: onCloseToggle },
              { label: 'Activer', color: 'primary', onPress: () => { toggleMutation.mutate({ id: toggleTarget!.charge.id, enable: true, supprimerDepense: false }); onCloseToggle(); } },
            ]
          : [
              { label: 'Conserver les dépenses', variant: 'bordered', onPress: () => { toggleMutation.mutate({ id: toggleTarget!.charge.id, enable: false, supprimerDepense: false }); onCloseToggle(); } },
              { label: 'Supprimer les dépenses', color: 'danger', onPress: () => { toggleMutation.mutate({ id: toggleTarget!.charge.id, enable: false, supprimerDepense: true }); onCloseToggle(); } },
            ]
        }
      >
        <p className="text-sm text-gray-700">
          Voulez-vous {toggleTarget?.enable ? 'activer' : 'désactiver'}{' '}
          <span className="font-semibold">{toggleTarget?.charge.designation}</span> ?
        </p>
        {!toggleTarget?.enable && (
          <p className="text-sm text-gray-500 mt-2">
            Souhaitez-vous également supprimer les anciennes dépenses associées ?
          </p>
        )}
      </ConfirmModal>

      {/* Delete */}
      <ConfirmModal
        isOpen={!!chargeToDelete}
        onClose={onCloseDelete}
        title="Supprimer la charge fixe"
        isLoading={isDeleting}
        actions={[
          { label: 'Annuler', variant: 'bordered', onPress: onCloseDelete },
          { label: 'Supprimer', color: 'danger', onPress: () => { supprimerChargeFixe(chargeToDelete!.id, { onSuccess: onCloseDelete }); } },
        ]}
      >
        <p className="text-sm text-gray-700">
          Voulez-vous vraiment supprimer <span className="font-semibold">{chargeToDelete?.designation}</span> ? Cette action est irréversible.
        </p>
      </ConfirmModal>

      {/* Justificatif Preview */}
      <Modal isOpen={!!previewUrl} onClose={onClosePreview} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-gray-900">Justificatif</ModalHeader>
          <ModalBody className="pb-6">
            {previewUrl && (
              isPdf(previewUrl)
                ? <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg border" title="Justificatif PDF" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={previewUrl} alt="Justificatif" className="w-full object-contain max-h-[70vh] rounded-lg" />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
