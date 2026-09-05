'use client';

import { Button, Modal } from '@heroui-v3/react';
import { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * La confirmation avant un geste irréversible du module Personnel.
 *
 * <p>Le bouton « Annuler » était peint en `color="danger"` : la couleur du DANGER sur le
 * bouton qui NE FAIT RIEN, pendant que « Confirmer » — celui qui supprime — restait en
 * bleu. Les deux couleurs disaient l'inverse de ce qui se passe. Annuler est neutre ;
 * c'est le geste confirmé qui porte le rouge.</p>
 */
export function ConfirmDialog({ isOpen, message, onConfirm, onOpenChange }: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Confirmation</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button onPress={handleConfirm} variant="danger">
                Confirmer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/** Ouvre le dialogue en retenant le message et le geste à exécuter. */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const openDialog = (msg: string, confirmCallback: () => void) => {
    setMessage(msg);
    setOnConfirm(() => confirmCallback);
    setIsOpen(true);
  };

  return {
    cancel: () => setIsOpen(false),
    confirm: () => {
      onConfirm?.();
      setIsOpen(false);
    },
    isOpen,
    message,
    onOpen: () => setIsOpen(true),
    onOpenChange: setIsOpen,
    openDialog,
  };
};
