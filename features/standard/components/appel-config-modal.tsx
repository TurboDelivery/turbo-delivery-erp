'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, CheckboxGroup, Modal, Switch } from '@heroui-v3/react';
import { MonitorUp, PhoneIncoming, Users } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
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
  const { data: config, isLoading, isError, isFetching, refetch } = useAppelConfigQuery(isOpen);
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

  /** Une case à cocher de rôle, montée deux fois : répondants puis superviseurs. */
  const caseRole = (role: (typeof ROLES_ORDONNES)[number]) => (
    <Checkbox key={role} value={role}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span className="text-sm">{ROLE_LABELS[role] ?? role}</span>
      </Checkbox.Content>
    </Checkbox>
  );

  /** Un réglage on/off avec son explication, monté deux fois. */
  const reglage = (
    Icone: typeof Users,
    titre: React.ReactNode,
    detail: string,
    actif: boolean,
    onChange: (v: boolean) => void,
    desactive?: boolean,
  ) => (
    <div className={`flex items-start justify-between gap-3 ${desactive ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Icone aria-hidden="true" className="size-4 text-muted" /> {titre}
        </p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
      <Switch isDisabled={desactive} isSelected={actif} onChange={onChange} size="sm">
        <Switch.Content>
          <Switch.Thumb />
        </Switch.Content>
      </Switch>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <PhoneIncoming aria-hidden="true" className="size-5 text-muted" />
                  Paramètres des appels
                </span>
                <span className="text-xs font-normal text-muted">
                  Qui reçoit les appels des livreurs, et qui peut écouter un appel en cours.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
              {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div className="h-10 animate-pulse rounded-lg bg-surface-secondary" key={i} />
                  ))}
                </div>
              ) : isError ? (
                // La config non lue laisse les cases decochees : le formulaire
                // annoncerait « aucun repondant » et on enregistrerait par-dessus.
                <EtatErreur
                  enCours={isFetching}
                  onReessayer={() => refetch()}
                  quoi="les paramètres des appels"
                />
              ) : (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-foreground">Répondants</p>
                    <p className="mb-2 text-xs text-muted">
                      Ces rôles sonnent quand un livreur appelle. Le premier qui décroche prend
                      l&apos;appel ; un refus n&apos;arrête la sonnerie que chez soi.
                    </p>
                    <CheckboxGroup onChange={setRepondants} value={repondants}>
                      {ROLES_ORDONNES.map(caseRole)}
                    </CheckboxGroup>
                    {repondants.length === 0 && (
                      <p className="mt-1 text-xs text-danger-soft-foreground">
                        Au moins un rôle répondant est requis.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-foreground">
                      Superviseurs (écoute)
                    </p>
                    <p className="mb-2 text-xs text-muted">
                      Ces rôles ne sonnent pas, mais peuvent rejoindre un appel en cours pour
                      l&apos;écouter (micro coupé). Laisser vide = personne.
                    </p>
                    <CheckboxGroup onChange={setSuperviseurs} value={superviseurs}>
                      {ROLES_ORDONNES.map(caseRole)}
                    </CheckboxGroup>
                  </div>

                  {/* Appels entre personnel Turbo (pair-à-pair) + partage d'écran. */}
                  <Card>
                    <Card.Content className="gap-3 p-3">
                      {reglage(
                        Users,
                        'Appels entre personnel Turbo',
                        'Autorise les appels audio in-app entre membres du personnel (en plus du circuit Standard ↔ livreur).',
                        appelsPersonnel,
                        setAppelsPersonnel,
                      )}
                      <div className="border-t border-separator pt-3">
                        {reglage(
                          MonitorUp,
                          <>Partage d&apos;écran</>,
                          "Autorise le partage d'écran pendant les appels du personnel.",
                          appelsPersonnel && partageEcran,
                          setPartageEcran,
                          !appelsPersonnel,
                        )}
                      </div>
                    </Card.Content>
                  </Card>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button isDisabled={modifier.isPending} onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button
                isDisabled={repondants.length === 0}
                isPending={modifier.isPending}
                onPress={enregistrer}
                variant="primary"
              >
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
