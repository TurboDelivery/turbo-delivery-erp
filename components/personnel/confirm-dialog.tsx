'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({ message, onConfirm, isOpen, onOpenChange }: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Confirmation</ModalHeader>
        <ModalBody>
          {message}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleCancel}>
            Annuler
          </Button>
          <Button color="primary" onPress={handleConfirm}>
            Confirmer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Hook personnalisé pour gérer le dialogue de confirmation
export const useConfirmDialog = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const openDialog = (msg: string, confirmCallback: () => void) => {
    setMessage(msg);
    setOnConfirm(() => confirmCallback);
    onOpen();
  };

  const confirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange();
  };

  const cancel = () => {
    onOpenChange();
  };

  return {
    isOpen,
    onOpen,
    onOpenChange,
    message,
    openDialog,
    confirm,
    cancel
  };
};
