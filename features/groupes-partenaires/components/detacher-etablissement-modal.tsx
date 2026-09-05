'use client';

import { Button, Modal } from '@heroui-v3/react';
import { Unlink } from 'lucide-react';
import { useMemo } from 'react';

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
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span>Détacher {nomEtablissement}</span>
                <span className="text-xs font-normal text-muted">Groupe « {groupe.nom} »</span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
          <RecapitulatifAcces
            recapitulatif={recapitulatif}
            intention={`Si vous détachez « ${nomEtablissement} » du groupe, voici ce qui change pour chacun de ses membres.`}
            note="Un accès accordé directement sur l'établissement survit au détachement : il avait été donné à l'établissement, pas au groupe. Seul l'accès hérité du groupe disparaît. L'établissement redevient disponible et pourra être rattaché à un autre groupe."
          />
            </Modal.Body>

            <Modal.Footer className="justify-between">
              <Button onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <Button
                isDisabled={recapitulatif.blocages.length > 0 || detacher.isPending}
                isPending={detacher.isPending}
                onPress={() => detacher.mutate(etablissement.restaurantId, { onSuccess: onClose })}
                variant="danger"
              >
                <Unlink aria-hidden="true" className="size-4" />
                Détacher l&apos;établissement
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
