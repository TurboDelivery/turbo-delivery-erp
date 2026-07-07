'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from '@heroui/react';
import { PhoneIncoming } from 'lucide-react';

import { APP_ROLES, type AppRole } from '@/lib/casl/ability';

import { useAppelConfigQuery, useModifierAppelConfigMutation } from '../queries/standard.query';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Libellés lisibles des rôles proposés comme répondants. */
const ROLE_LABELS: Partial<Record<AppRole, string>> = {
  STANDARD: "Standard (centrale d'appel)",
  OPS_MANAGER: 'Ops Manager',
  DIRECTEUR_OPERATIONS: 'Directeur des opérations',
  DGA: 'DGA',
  DG: 'DG',
  TRESORIER: 'Trésorier',
  COMPTABLE: 'Comptable',
  ASSISTANT_COMPTABLE: 'Assistant comptable',
  BUSINESS_DEVELOPER: 'Business Developer',
  RESPONSABLE_VA: 'Responsable VA',
  RECOUVREUR: 'Recouvreur',
  CAISSIER: 'Caissier',
  AUTHENTIFICATION_VERIFICATION: 'Authentification / Vérification',
  AGENT_V1: 'Agent V1',
  RESPONSABLE_AUTH_COUPONS: 'Responsable Auth Coupons',
};

/** Rôles mis en avant (métier appel) — le reste suit dans l'ordre du référentiel. */
const ORDRE_PRIORITAIRE: AppRole[] = ['STANDARD', 'OPS_MANAGER', 'DIRECTEUR_OPERATIONS', 'DGA', 'DG'];
const ROLES_ORDONNES: AppRole[] = [
  ...ORDRE_PRIORITAIRE,
  ...APP_ROLES.filter((r) => !ORDRE_PRIORITAIRE.includes(r)),
];

/**
 * Configuration du groupe de réponse : quels RÔLES sonnent quand un livreur
 * appelle le STANDARD. Comportement groupe d'appel : le premier qui décroche
 * prend l'appel (les autres s'arrêtent) ; un refus est local à l'agent.
 */
export function AppelConfigModal({ isOpen, onOpenChange }: Props) {
  const { data: config, isLoading } = useAppelConfigQuery(isOpen);
  const modifier = useModifierAppelConfigMutation();
  const [selection, setSelection] = useState<string[]>([]);

  useEffect(() => {
    // (Ré)initialise la sélection à l'ouverture, depuis la config serveur.
    if (isOpen && config) setSelection(config.rolesRepondants);
  }, [isOpen, config]);

  const enregistrer = () => {
    if (selection.length === 0) return;
    modifier.mutate(
      { rolesRepondants: selection },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-primary">
                <PhoneIncoming className="h-5 w-5" />
                Répondants aux appels
              </span>
              <span className="text-xs font-normal text-default-400">
                Les utilisateurs de ces rôles sonnent quand un livreur appelle. Le premier qui
                décroche prend l&apos;appel ; un refus n&apos;arrête la sonnerie que chez soi.
              </span>
            </ModalHeader>

            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner color="primary" label="Chargement…" />
                </div>
              ) : (
                <CheckboxGroup value={selection} onValueChange={setSelection}>
                  {ROLES_ORDONNES.map((role) => (
                    <Checkbox key={role} value={role}>
                      {ROLE_LABELS[role] ?? role}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              )}
              {selection.length === 0 && !isLoading && (
                <p className="text-xs text-danger">
                  Au moins un rôle est requis, sinon plus personne ne reçoit les appels.
                </p>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={modifier.isLoading}>
                Annuler
              </Button>
              <Button
                color="primary"
                isLoading={modifier.isLoading}
                isDisabled={selection.length === 0}
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
