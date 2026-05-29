'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Button,
  Chip,
  Spinner,
} from '@heroui/react';
import { EyeOff } from 'lucide-react';
import { useCreneauxListQuery, useSetCreneauActifMutation } from '../queries/creneau.query';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * V58 (2026-05-29) — Écran admin "Gérer les créneaux".
 *
 * <p>Liste exhaustive des créneaux (actifs et inactifs confondus) avec un
 * switch par ligne pour basculer la visibilité. Le bouton d'ouverture
 * de cette modale est exposé dans le header de la grille de paiement.
 * Le backend conserve l'historique intact ; seul le drapeau {@code actif}
 * est modifié, ce qui retire le créneau des pickers de l'UI normale tout
 * en préservant les tickets, lots et écritures comptables qui pointent
 * vers lui.</p>
 *
 * <p>Sécurité : à terme, on pourrait masquer ce bouton derrière une
 * permission CASL dédiée (par ex. {@code manage Creneau}). Pour l'instant,
 * tout utilisateur ayant accès à la grille de paiement peut basculer.</p>
 */
export default function CreneauxAdminModal({ open, onClose }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  // includeInactifs=true → la liste contient les deux populations.
  const { data, isLoading } = useCreneauxListQuery(100, true);
  const { mutate, isPending, variables } = useSetCreneauActifMutation();

  const creneaux = useMemo(() => data?.content ?? [], [data]);
  const nbActifs = creneaux.filter((c) => c.actif !== false).length;
  const nbInactifs = creneaux.length - nbActifs;

  function handleToggle(id: string, current: boolean) {
    if (!userId) return;
    mutate({ creneauId: id, actif: !current, userId });
  }

  return (
    <Modal isOpen={open} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-gray-900">Gérer les créneaux</h2>
          <p className="text-xs font-normal text-gray-500">
            Masquer un créneau le retire des pickers UI sans toucher à l&apos;historique
            (tickets, lots et écritures conservés). {nbActifs} actif{nbActifs > 1 ? 's' : ''}
            {' · '}
            {nbInactifs} masqué{nbInactifs > 1 ? 's' : ''}.
          </p>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner color="primary" />
            </div>
          ) : creneaux.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun créneau.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {creneaux.map((c) => {
                const actif = c.actif !== false; // undefined ≡ actif (rétro-compat)
                const isBusy = isPending && variables?.creneauId === c.id;
                return (
                  <li key={c.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                        {c.label}
                        {!actif && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="warning"
                            startContent={<EyeOff className="w-3 h-3" />}
                          >
                            Masqué
                          </Chip>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.dateDebut} → {c.dateFin}
                        {c.lotStatut && (
                          <span className="ml-2 text-gray-400">· lot {c.lotStatut}</span>
                        )}
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      isSelected={actif}
                      isDisabled={isBusy || !userId}
                      onValueChange={() => handleToggle(c.id, actif)}
                      aria-label={`Activer/désactiver ${c.label}`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
