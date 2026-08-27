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
  Switch,
} from '@heroui/react';
import { MonitorUp, PhoneIncoming, Users } from 'lucide-react';

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
  const [repondants, setRepondants] = useState<string[]>([]);
  const [superviseurs, setSuperviseurs] = useState<string[]>([]);
  const [appelsPersonnel, setAppelsPersonnel] = useState(false);
  const [partageEcran, setPartageEcran] = useState(false);

  useEffect(() => {
    // (Ré)initialise les sélections à l'ouverture, depuis la config serveur.
    if (isOpen && config) {
      setRepondants(config.rolesRepondants);
      setSuperviseurs(config.rolesSuperviseurs ?? []);
      setAppelsPersonnel(!!config.appelsPersonnelActifs);
      setPartageEcran(!!config.partageEcranActif);
    }
  }, [isOpen, config]);

  const enregistrer = () => {
    if (repondants.length === 0) return;
    modifier.mutate(
      {
        rolesRepondants: repondants,
        rolesSuperviseurs: superviseurs,
        appelsPersonnelActifs: appelsPersonnel,
        // Le partage d'écran n'a de sens que si les appels personnel sont actifs.
        partageEcranActif: appelsPersonnel && partageEcran,
      },
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
                Paramètres des appels
              </span>
              <span className="text-xs font-normal text-default-400">
                Qui reçoit les appels des livreurs, et qui peut écouter un appel en cours.
              </span>
            </ModalHeader>

            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner color="primary" label="Chargement…" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-default-700">Répondants</p>
                    <p className="mb-2 text-xs text-default-400">
                      Ces rôles sonnent quand un livreur appelle. Le premier qui décroche prend
                      l&apos;appel ; un refus n&apos;arrête la sonnerie que chez soi.
                    </p>
                    <CheckboxGroup value={repondants} onValueChange={setRepondants}>
                      {ROLES_ORDONNES.map((role) => (
                        <Checkbox key={role} value={role}>
                          {ROLE_LABELS[role] ?? role}
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                    {repondants.length === 0 && (
                      <p className="mt-1 text-xs text-danger">
                        Au moins un rôle répondant est requis.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-default-700">
                      Superviseurs (écoute)
                    </p>
                    <p className="mb-2 text-xs text-default-400">
                      Ces rôles ne sonnent pas, mais peuvent rejoindre un appel en cours pour
                      l&apos;écouter (micro coupé). Laisser vide = personne.
                    </p>
                    <CheckboxGroup value={superviseurs} onValueChange={setSuperviseurs}>
                      {ROLES_ORDONNES.map((role) => (
                        <Checkbox key={role} value={role}>
                          {ROLE_LABELS[role] ?? role}
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  </div>

                  {/* Appels entre personnel Turbo (pair-à-pair) + partage d'écran. */}
                  <div className="rounded-xl border border-default-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-default-700">
                          <Users className="h-4 w-4 text-primary" /> Appels entre personnel Turbo
                        </p>
                        <p className="mt-0.5 text-xs text-default-400">
                          Autorise les appels audio in-app entre membres du personnel (en plus du
                          circuit Standard ↔ livreur).
                        </p>
                      </div>
                      <Switch
                        size="sm"
                        isSelected={appelsPersonnel}
                        onValueChange={setAppelsPersonnel}
                        aria-label="Activer les appels entre personnel Turbo"
                      />
                    </div>

                    <div
                      className={`mt-3 flex items-start justify-between gap-3 border-t border-default-100 pt-3 ${
                        appelsPersonnel ? '' : 'opacity-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-default-700">
                          <MonitorUp className="h-4 w-4 text-primary" /> Partage d&apos;écran
                        </p>
                        <p className="mt-0.5 text-xs text-default-400">
                          Autorise le partage d&apos;écran pendant les appels du personnel.
                        </p>
                      </div>
                      <Switch
                        size="sm"
                        isSelected={appelsPersonnel && partageEcran}
                        isDisabled={!appelsPersonnel}
                        onValueChange={setPartageEcran}
                        aria-label="Activer le partage d'écran pendant les appels du personnel"
                      />
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={modifier.isPending}>
                Annuler
              </Button>
              <Button
                color="primary"
                isLoading={modifier.isPending}
                isDisabled={repondants.length === 0}
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
