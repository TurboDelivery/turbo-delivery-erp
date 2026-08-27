'use client';

import { useMemo } from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Unlink } from 'lucide-react';

import { useDetacherEtablissementMutation } from '../queries/groupes-partenaires.query';
import { IEtablissementDuGroupe, IGroupeDetail } from '../types/groupes-partenaires.types';
import { simulerDetachement } from '../utils/simulation-groupe.utils';
import { RecapitulatifAcces } from './recapitulatif-acces';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupe: IGroupeDetail;
  etablissement: IEtablissementDuGroupe;
  userId: string;
}

/**
 * Détachement d'un établissement.
 *
 * C'est la seule opération du module qui retire quelque chose, et elle va directement
 * au récapitulatif : il n'y a rien à composer, seulement quelque chose à mesurer. Les
 * comptes qui perdent l'accès apparaissent en tête, barrés, sans euphémisme.
 */
export function DetacherEtablissementModal({ isOpen, onClose, groupe, etablissement, userId }: Props) {
  const detacher = useDetacherEtablissementMutation(groupe.id, userId);
  const recapitulatif = useMemo(
    () => simulerDetachement(groupe, etablissement.restaurantId),
    [groupe, etablissement.restaurantId],
  );

  const nomEtablissement = etablissement.nom ?? 'cet établissement';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>Détacher {nomEtablissement}</span>
          <span className="text-[12px] font-normal text-default-500">Groupe « {groupe.nom} »</span>
        </ModalHeader>

        <ModalBody>
          <RecapitulatifAcces
            recapitulatif={recapitulatif}
            intention={`Si vous détachez « ${nomEtablissement} » du groupe, voici ce qui change pour chacun de ses membres.`}
            note="Un accès accordé directement sur l'établissement survit au détachement : il avait été donné à l'établissement, pas au groupe. Seul l'accès hérité du groupe disparaît. L'établissement redevient disponible et pourra être rattaché à un autre groupe."
          />
        </ModalBody>

        <ModalFooter className="justify-between">
          <Button variant="light" onPress={onClose}>
            Annuler
          </Button>
          <Button
            color="danger"
            startContent={<Unlink className="h-4 w-4" />}
            isDisabled={recapitulatif.blocages.length > 0 || detacher.isLoading}
            isLoading={detacher.isLoading}
            onPress={() => detacher.mutate(etablissement.restaurantId, { onSuccess: onClose })}
          >
            Détacher l&apos;établissement
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
