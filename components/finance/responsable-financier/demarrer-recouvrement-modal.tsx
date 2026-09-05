'use client';

import { Button, Drawer, Label, Radio, RadioGroup, Skeleton } from '@heroui-v3/react';
import { useEffect, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { type IAgentRecouvrement, useAgentsRecouvrementQuery } from '@/features/responsable-financier';
import { formatMontant } from '@/utils/format.utils';

import type { IFactureRF } from './responsable-financier-columns';

export type IAgent = IAgentRecouvrement;

interface Props {
  facture: IFactureRF | null;
  onClose: () => void;
  onConfirm: (facture: IFactureRF, agent: IAgent) => void;
  open: boolean;
}

/**
 * Le panneau d'assignation d'un agent de recouvrement.
 *
 * <p>C'était un `Sheet` shadcn peint à la main : `bg-red-600 hover:bg-red-700 text-white`
 * pour le bouton, `border-red-400 bg-red-50` pour l'agent choisi, `text-red-500` pour le
 * montant et pour l'astérisque du champ requis — cinq teintes de la palette Tailwind sans
 * variante sombre. C'est le `Drawer` de la bibliothèque.</p>
 *
 * <p>La liste des agents était une pile de `<button>` avec une coche dessinée en SVG à la
 * main. C'est un choix UNIQUE parmi N : un `RadioGroup` le dit, l'annonce aux lecteurs
 * d'écran et se parcourt aux flèches.</p>
 */
export default function DemarrerRecouvrementDrawer({ facture, onClose, onConfirm, open }: Props) {
  const { data: agents = [], isError, isFetching, isLoading, refetch } = useAgentsRecouvrementQuery();
  const [selectedAgent, setSelectedAgent] = useState<IAgent | null>(null);

  // Reset à chaque ouverture / changement de facture : le COMPTABLE doit
  // explicitement choisir le recouvreur, pas hériter du premier de la liste ni
  // d'une sélection précédente. Le bouton "Démarrer" reste désactivé tant
  // qu'aucun agent n'est sélectionné.
  useEffect(() => {
    if (open) setSelectedAgent(null);
  }, [open, facture?.id]);

  function handleConfirm() {
    if (facture && selectedAgent) onConfirm(facture, selectedAgent);
    onClose();
  }

  return (
    <Drawer isOpen={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full sm:max-w-md">
            <Drawer.Header>
              <Drawer.Heading>Démarrer le recouvrement</Drawer.Heading>
              <Drawer.CloseTrigger />
            </Drawer.Header>

            <Drawer.Body className="flex flex-col gap-5">
              <p className="text-sm text-muted">
                Assigner un agent recouvrement pour cette facture. L&apos;agent sera responsable de
                la récupération du paiement auprès du partenaire.
              </p>

              {facture && (
                <div className="flex flex-col gap-3 rounded-xl border border-separator bg-surface-secondary p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Détails de la facture
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="mb-0.5 text-xs text-muted">N° Facture</p>
                      <p className="font-medium text-foreground">{facture.numero}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-muted">Partenaire</p>
                      <p className="font-medium text-foreground">{facture.partenaire}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-muted">Montant</p>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatMontant(facture.montant)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-muted">Date d&apos;émission</p>
                      <p className="font-medium text-foreground">{facture.emission}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* sur echec la liste restait vide : le comptable croyait qu'aucun agent n'existait */}
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton className="h-14 w-full rounded-xl" key={`sq-${i}`} />
                  ))}
                </div>
              ) : isError ? (
                <EtatErreur
                  enCours={isFetching}
                  onReessayer={() => refetch()}
                  quoi="les agents de recouvrement"
                />
              ) : (
                <RadioGroup
                  isRequired
                  onChange={(v) => setSelectedAgent(agents.find((a) => a.id === v) ?? null)}
                  value={selectedAgent?.id ?? ''}
                >
                  <Label>Sélectionner un agent recouvrement</Label>
                  <div className="flex flex-col gap-2">
                    {agents.map((agent) => (
                      <Radio key={agent.id} value={agent.id}>
                        <Radio.Content className="flex w-full items-center gap-3">
                          <Radio.Control>
                            <Radio.Indicator />
                          </Radio.Control>
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-xs font-bold text-muted">
                            {agent.nom.charAt(0)}
                          </span>
                          <span className="flex flex-col items-start">
                            <span className="text-sm font-medium text-foreground">{agent.nom}</span>
                            <span className="text-xs text-muted">{agent.role}</span>
                          </span>
                        </Radio.Content>
                      </Radio>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </Drawer.Body>

            <Drawer.Footer>
              <Button
                className="w-full"
                isDisabled={!selectedAgent}
                onPress={handleConfirm}
                variant="primary"
              >
                Démarrer le recouvrement
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
