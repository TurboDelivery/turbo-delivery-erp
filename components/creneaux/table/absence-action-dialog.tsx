'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from '@heroui/react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useJustifierAbsenceMutation, useAccuserRetardMutation } from '@/features/creneaux/mutations/index.query';
import { Can } from '@/components/auth/Can';

export interface AbsenceActionTarget {
  emploiId: string;
  turoyNomComplet: string;
  date: string;      // ISO "2026-04-13"
  jourLabel: string; // "Lundi", "Mardi" …
}

type Action = 'justifier' | 'retard' | null;

interface AbsenceActionDialogProps {
  target: AbsenceActionTarget | null;
  onClose: () => void;
}

export function AbsenceActionDialog({ target, onClose }: AbsenceActionDialogProps) {
  const [action, setAction] = useState<Action>(null);
  const [motif, setMotif] = useState('');

  const justifierMutation = useJustifierAbsenceMutation();
  const retardMutation = useAccuserRetardMutation();

  const isOpen = target !== null;

  function handleClose() {
    setAction(null);
    setMotif('');
    onClose();
  }

  async function handleConfirm() {
    if (!target) return;

    if (action === 'justifier') {
      await justifierMutation.mutateAsync({
        id: target.emploiId,
        date: target.date,
        motif,
      });
      handleClose();
    } else if (action === 'retard') {
      await retardMutation.mutateAsync({
        id: target.emploiId,
        date: target.date,
        motif,
      });
      handleClose();
    }
  }

  const isPending = justifierMutation.isPending || retardMutation.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }} size="sm">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">Absence — {target?.turoyNomComplet}</span>
          <span className="text-xs font-normal text-default-400">
            {target?.jourLabel} · {target?.date}
          </span>
        </ModalHeader>

        <ModalBody className="gap-3">
          {/* Action selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAction('justifier')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                action === 'justifier'
                  ? 'border-success bg-success-50 text-success'
                  : 'border-border hover:border-success/50 hover:bg-success-50/40'
              }`}
            >
              <AlertTriangle className="size-5" />
              Justifier l&apos;absence
            </button>

            <button
              onClick={() => setAction('retard')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                action === 'retard'
                  ? 'border-warning bg-warning-50 text-warning'
                  : 'border-border hover:border-warning/50 hover:bg-warning-50/40'
              }`}
            >
              <Clock className="size-5" />
              Accuser un retard
            </button>
          </div>

          {/* Motif input */}
          {(action === 'justifier' || action === 'retard') && (
            <Textarea
              label="Motif"
              placeholder={action === 'justifier' ? 'Saisir le motif de justification...' : 'Saisir le motif du retard...'}
              value={motif}
              onValueChange={setMotif}
              minRows={3}
              isRequired
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={isPending}>
            Annuler
          </Button>
          <Can I="manage" a="Creneau">
            <Button
              color={action === 'justifier' ? 'success' : 'warning'}
              onPress={handleConfirm}
              isLoading={isPending}
              isDisabled={
                !action ||
                motif.trim().length === 0
              }
            >
              Confirmer
            </Button>
          </Can>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
