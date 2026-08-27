'use client';

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import React from 'react';

interface ConfirmModalAction {
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'ghost';
  onPress: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions: ConfirmModalAction[];
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConfirmModal({ isOpen, onClose, title, children, actions, isLoading, size = 'sm' }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          {actions.map((action) => (
            <Button
              key={action.label}
              color={action.color ?? 'default'}
              variant={action.variant ?? 'solid'}
              onPress={action.onPress}
              isLoading={isLoading}
            >
              {action.label}
            </Button>
          ))}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
