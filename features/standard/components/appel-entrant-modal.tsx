'use client';

import { Button, Modal, ModalBody, ModalContent, ModalFooter } from '@heroui/react';
import { IconPhone, IconPhoneOff } from '@tabler/icons-react';

interface AppelEntrantModalProps {
  titre: string;
  message: string;
  onAccepter: () => void;
  onRefuser: () => void;
}

/** Modale d'appel AUDIO entrant (livreur → STANDARD) sur la console. */
export function AppelEntrantModal({ titre, message, onAccepter, onRefuser }: AppelEntrantModalProps) {
  return (
    <Modal isOpen isDismissable={false} hideCloseButton placement="center" size="sm">
      <ModalContent>
        <ModalBody className="items-center gap-2 py-8 text-center">
          <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-success/10 text-success">
            <IconPhone size={30} />
          </div>
          <p className="text-lg font-semibold text-default-800">{titre || 'Appel entrant'}</p>
          {message && <p className="text-sm text-default-500">{message}</p>}
        </ModalBody>
        <ModalFooter className="justify-center gap-4 pb-6">
          <Button color="danger" variant="flat" startContent={<IconPhoneOff size={18} />} onPress={onRefuser}>
            Refuser
          </Button>
          <Button color="success" startContent={<IconPhone size={18} />} onPress={onAccepter}>
            Répondre
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
