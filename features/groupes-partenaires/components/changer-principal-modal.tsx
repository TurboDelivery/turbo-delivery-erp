'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, Modal, Radio, RadioGroup } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
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
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span>Changer le compte principal</span>
                <span className="text-xs font-normal text-muted">
                  Groupe « {groupe.nom} » — compte principal actuel :{' '}
                  {groupe.proprietaire ? nomCompte(groupe.proprietaire) : 'aucun'}
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
          {etape === 'choix' ? (
            candidats.length === 0 ? (
              <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground">
                Ce groupe n&apos;a pas d&apos;autre membre. Rattachez un établissement supplémentaire, ou créez un
                accès partenaire, pour disposer d&apos;un candidat.
              </p>
            ) : (
              <RadioGroup
                aria-label="Nouveau compte principal"
                onChange={setChoisi}
                value={choisi ?? ''}
              >
                <div className="flex flex-col gap-1.5">
                  {candidats.map((membre) => (
                    <div
                      className={cn(
                        'rounded-lg border px-3 py-2 transition-colors',
                        choisi === membre.userId
                          ? 'border-accent bg-accent-soft/30'
                          : 'border-separator',
                      )}
                      key={membre.userId}
                    >
                      <Radio className="w-full items-start" value={membre.userId}>
                        <Radio.Content className="flex w-full items-start gap-3">
                          <Radio.Control className="mt-1">
                            <Radio.Indicator />
                          </Radio.Control>
                          <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {nomCompte(membre)}
                              </span>
                              <span className="block truncate text-xs text-muted">
                                {membre.email ?? '—'}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <RoleChip role={membre.role} />
                              <PorteeChip portee={membre.portee} />
                              {membre.restaurantNom && (
                                <Chip size="sm" variant="soft">
                                  <Chip.Label>{membre.restaurantNom}</Chip.Label>
                                </Chip>
                              )}
                            </span>
                          </span>
                        </Radio.Content>
                      </Radio>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )
          ) : (
            <RecapitulatifAcces
              recapitulatif={recapitulatif}
              intention={`Si vous désignez ce compte comme principal sur le groupe « ${groupe.nom} », voici ce qui change pour chacun de ses membres.`}
              note="Le compte principal sortant reste membre du groupe avec un accès à l'ensemble des établissements : le changement transfère le titre, il ne révoque aucun accès. Le retirer du groupe serait une seconde décision, explicite."
            />
          )}
            </Modal.Body>

            <Modal.Footer className="justify-between">
              <Button onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <div className="flex items-center gap-2">
                {etape === 'recapitulatif' && (
                  <Button onPress={() => setEtape('choix')} variant="outline">
                    Retour
                  </Button>
                )}
                {etape === 'choix' ? (
                  <Button
                    isDisabled={!choisi}
                    onPress={() => setEtape('recapitulatif')}
                    variant="primary"
                  >
                    <Crown aria-hidden="true" className="size-4" />
                    Voir ce qui va changer
                  </Button>
                ) : (
                  <Button
                    isDisabled={!choisi}
                    isPending={changer.isPending}
                    onPress={valider}
                    variant="primary"
                  >
                    Désigner ce compte principal
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
