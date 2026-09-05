'use client';

import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';

import { Can } from '@/components/auth/Can';
import { ChampZoneTexte } from '@/components/commons/champs-formulaire';
import {
  useAccuserRetardMutation,
  useJustifierAbsenceMutation,
} from '@/features/creneaux/mutations/index.query';

export interface AbsenceActionTarget {
  date: string; // ISO "2026-04-13"
  emploiId: string;
  jourLabel: string; // "Lundi", "Mardi" …
  turoyNomComplet: string;
}

type Action = 'justifier' | 'retard' | null;

interface AbsenceActionDialogProps {
  onClose: () => void;
  target: AbsenceActionTarget | null;
}

const ACTIONS = [
  { icone: AlertTriangle, id: 'justifier', libelle: "Justifier l'absence" },
  { icone: Clock, id: 'retard', libelle: 'Accuser un retard' },
] as const;

const INVITE: Record<Exclude<Action, null>, string> = {
  justifier: 'Pourquoi cette absence est-elle justifiée ?',
  retard: "De combien, et pour quelle raison ? C'est ce motif que lira le livreur.",
};

/**
 * Requalifier une absence : la justifier, ou la ramener à un retard.
 *
 * <h3>Ce qui change</h3>
 * <p>Le choix entre les deux gestes se faisait sur deux `&lt;button&gt;` nus portant chacun
 * quinze classes recopiées pour imiter une case à cocher — bordure verte quand « justifier »
 * était choisi, bordure ambre pour « retard ». Aucun des deux n'était annoncé comme
 * sélectionné : au clavier et au lecteur d'écran, c'étaient deux boutons ordinaires dont
 * rien ne disait lequel était actif. C'est un choix unique entre deux options, donc un
 * `ToggleButtonGroup`, qui porte `aria-pressed` tout seul.</p>
 *
 * <p>Le bouton de confirmation virait au vert pour l'un et à l'ambre pour l'autre.
 * Confirmer n'est ni un succès ni un avertissement : c'est l'action principale de la
 * fenêtre, et elle en garde la couleur.</p>
 *
 * <p>Le champ de motif ne disait pas ce qu'on attend d'un motif. Il porte maintenant une
 * invite propre à chacun des deux gestes.</p>
 */
export function AbsenceActionDialog({ onClose, target }: AbsenceActionDialogProps) {
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
    if (!target || !action) return;

    const mutation = action === 'justifier' ? justifierMutation : retardMutation;
    await mutation.mutateAsync({ date: target.date, id: target.emploiId, motif });
    handleClose();
  }

  const isPending = justifierMutation.isPending || retardMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <div className="flex flex-col gap-0.5">
                <Modal.Heading>Absence de {target?.turoyNomComplet}</Modal.Heading>
                <span className="text-xs text-muted">
                  {target?.jourLabel} · {target?.date}
                </span>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              <ToggleButtonGroup
                className="flex-wrap"
                onSelectionChange={(sel) => setAction((Array.from(sel)[0] as Action) ?? null)}
                selectedKeys={action ? new Set([action]) : new Set()}
                selectionMode="single"
              >
                {ACTIONS.map((a) => (
                  <ToggleButton id={a.id} key={a.id}>
                    <a.icone aria-hidden="true" className="size-4" />
                    {a.libelle}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {action && (
                <ChampZoneTexte
                  label="Motif"
                  onChange={setMotif}
                  placeholder={INVITE[action]}
                  valeur={motif}
                />
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button isDisabled={isPending} onPress={handleClose} variant="ghost">
                Annuler
              </Button>
              <Can I="manage" a="Creneau">
                <Button
                  isDisabled={!action || motif.trim().length === 0}
                  isPending={isPending}
                  onPress={handleConfirm}
                  variant="primary"
                >
                  Confirmer
                </Button>
              </Can>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
