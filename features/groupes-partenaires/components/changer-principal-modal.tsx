'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
} from '@heroui/react';
import { Crown } from 'lucide-react';

import { useChangerProprietaireMutation } from '../queries/groupes-partenaires.query';
import { IComptePartenaire, IGroupeDetail } from '../types/groupes-partenaires.types';
import { nomCompte, simulerChangementProprietaire } from '../utils/simulation-groupe.utils';
import { PorteeChip, RoleChip } from './acces-chips';
import { RecapitulatifAcces } from './recapitulatif-acces';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupe: IGroupeDetail;
  userId: string;
}

/**
 * Désignation d'un autre compte principal.
 *
 * Même règle que la constitution : le choix se fait parmi les membres du groupe, et le
 * récapitulatif s'affiche avant le bouton. Le compte sortant conserve son accès —
 * l'écran l'écrit noir sur blanc plutôt que de laisser l'administrateur le supposer.
 */
export function ChangerPrincipalModal({ isOpen, onClose, groupe, userId }: Props) {
  const [choisi, setChoisi] = useState<string | null>(null);
  const [etape, setEtape] = useState<'choix' | 'recapitulatif'>('choix');
  const changer = useChangerProprietaireMutation(groupe.id, userId);

  useEffect(() => {
    if (isOpen) return;
    setChoisi(null);
    setEtape('choix');
  }, [isOpen]);

  /** Un compte par personne : les accès multiples d'un même individu sont fusionnés. */
  const candidats = useMemo(() => {
    const parCompte = new Map<string, IComptePartenaire>();
    groupe.membres.forEach((membre) => {
      const existant = parCompte.get(membre.userId);
      if (!existant || (existant.portee !== 'GROUPE' && membre.portee === 'GROUPE')) {
        parCompte.set(membre.userId, membre);
      }
    });
    return Array.from(parCompte.values())
      .filter((membre) => membre.userId !== groupe.proprietaire?.userId)
      .sort((a, b) => nomCompte(a).localeCompare(nomCompte(b), 'fr'));
  }, [groupe]);

  const recapitulatif = useMemo(
    () => simulerChangementProprietaire(groupe, choisi),
    [groupe, choisi],
  );

  const valider = () => {
    if (!choisi) return;
    changer.mutate(choisi, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>Changer le compte principal</span>
          <span className="text-[12px] font-normal text-default-500">
            Groupe « {groupe.nom} » — compte principal actuel :{' '}
            {groupe.proprietaire ? nomCompte(groupe.proprietaire) : 'aucun'}
          </span>
        </ModalHeader>

        <ModalBody>
          {etape === 'choix' ? (
            candidats.length === 0 ? (
              <p className="rounded-medium border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-default-600">
                Ce groupe n&apos;a pas d&apos;autre membre. Rattachez un établissement supplémentaire, ou créez un
                accès partenaire, pour disposer d&apos;un candidat.
              </p>
            ) : (
              <RadioGroup
                aria-label="Nouveau compte principal"
                value={choisi ?? ''}
                onValueChange={setChoisi}
                classNames={{ wrapper: 'gap-1.5' }}
              >
                {candidats.map((membre) => (
                  <Radio
                    key={membre.userId}
                    value={membre.userId}
                    classNames={{
                      base: 'm-0 max-w-full items-start gap-2 rounded-medium border border-default-200 px-3 py-2 data-[selected=true]:border-primary',
                      label: 'w-full',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{nomCompte(membre)}</p>
                        <p className="truncate text-[11px] text-default-400">{membre.email ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RoleChip role={membre.role} />
                        <PorteeChip portee={membre.portee} />
                        {membre.restaurantNom && (
                          <Chip size="sm" variant="flat">
                            {membre.restaurantNom}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
            )
          ) : (
            <RecapitulatifAcces
              recapitulatif={recapitulatif}
              intention={`Si vous désignez ce compte comme principal sur le groupe « ${groupe.nom} », voici ce qui change pour chacun de ses membres.`}
              note="Le compte principal sortant reste membre du groupe avec un accès à l'ensemble des établissements : le changement transfère le titre, il ne révoque aucun accès. Le retirer du groupe serait une seconde décision, explicite."
            />
          )}
        </ModalBody>

        <ModalFooter className="justify-between">
          <Button variant="light" onPress={onClose}>
            Annuler
          </Button>
          <div className="flex items-center gap-2">
            {etape === 'recapitulatif' && (
              <Button variant="flat" onPress={() => setEtape('choix')}>
                Retour
              </Button>
            )}
            {etape === 'choix' ? (
              <Button
                color="primary"
                isDisabled={!choisi}
                startContent={<Crown className="h-4 w-4" />}
                onPress={() => setEtape('recapitulatif')}
              >
                Voir ce qui va changer
              </Button>
            ) : (
              <Button color="primary" isDisabled={!choisi} isLoading={changer.isPending} onPress={valider}>
                Désigner ce compte principal
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
