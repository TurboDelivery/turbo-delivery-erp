'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Textarea,
} from '@heroui/react';
import { PhoneCall, PhoneMissed } from 'lucide-react';

import { useConsignerAppelMutation } from '../queries/chat-partenaires.query';

interface ConsignerAppelModalProps {
  restaurantId: string | null;
  restaurantNom: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Consigne un appel téléphonique passé à un partenaire depuis le poste
 * STANDARD : abouti ou manqué, durée facultative, commentaire libre.
 * L'appel consigné alimente le journal de la demande de coursier.
 */
export function ConsignerAppelModal({ restaurantId, restaurantNom, isOpen, onOpenChange }: ConsignerAppelModalProps) {
  const consigner = useConsignerAppelMutation();

  const [abouti, setAbouti] = useState<'oui' | 'non'>('oui');
  const [minutes, setMinutes] = useState('');
  const [secondes, setSecondes] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // Chaque ouverture repart d'une fiche vierge : on consigne UN appel.
  useEffect(() => {
    if (isOpen) {
      setAbouti('oui');
      setMinutes('');
      setSecondes('');
      setCommentaire('');
    }
  }, [isOpen]);

  const duree = (() => {
    const m = parseInt(minutes, 10);
    const s = parseInt(secondes, 10);
    const total = (Number.isFinite(m) ? m * 60 : 0) + (Number.isFinite(s) ? s : 0);
    return total > 0 ? total : undefined;
  })();

  const enregistrer = () => {
    if (!restaurantId) return;
    consigner.mutate(
      {
        restaurantId,
        dto: {
          abouti: abouti === 'oui',
          ...(abouti === 'oui' && duree !== undefined ? { dureeSecondes: duree } : {}),
          ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-primary">Consigner un appel</span>
              <span className="text-sm font-normal text-default-500">{restaurantNom}</span>
            </ModalHeader>
            <ModalBody>
              <RadioGroup
                orientation="horizontal"
                value={abouti}
                onValueChange={(v) => setAbouti(v as 'oui' | 'non')}
              >
                <Radio value="oui">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4 text-[#1AA05A]" />
                    Abouti
                  </span>
                </Radio>
                <Radio value="non">
                  <span className="flex items-center gap-1.5">
                    <PhoneMissed className="h-4 w-4 text-[#E11D48]" />
                    Manqué
                  </span>
                </Radio>
              </RadioGroup>

              {abouti === 'oui' && (
                <div className="flex items-end gap-2">
                  <Input
                    type="number"
                    min={0}
                    label="Durée"
                    placeholder="0"
                    value={minutes}
                    onValueChange={setMinutes}
                    endContent={<span className="text-xs text-default-400">min</span>}
                    className="max-w-[110px]"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    aria-label="Secondes"
                    placeholder="0"
                    value={secondes}
                    onValueChange={setSecondes}
                    endContent={<span className="text-xs text-default-400">s</span>}
                    className="max-w-[110px]"
                  />
                </div>
              )}

              <Textarea
                label="Commentaire"
                placeholder="Motif de l'appel, suite à donner…"
                value={commentaire}
                onValueChange={setCommentaire}
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                color="primary"
                isLoading={consigner.isPending}
                isDisabled={!restaurantId}
                onPress={enregistrer}
              >
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
