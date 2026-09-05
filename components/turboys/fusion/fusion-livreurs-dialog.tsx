'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Button, Checkbox, Chip, Modal, Radio, RadioGroup } from '@heroui-v3/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AlertTriangle, GitMerge } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';
import {
  donneesRattacheesRequest,
  fusionnerLivreursRequest,
  type ILivreurDonneesRattachees,
} from '@/features/turboys/apis/fusion-livreur.api';
import { turboyKeys } from '@/features/turboys/queries';

interface Props {
  ids: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}

const METRIQUES: { key: keyof ILivreurDonneesRattachees; label: string }[] = [
  { key: 'tickets', label: 'Tickets' },
  { key: 'courses', label: 'Courses' },
  { key: 'emplois', label: 'Emplois / pointages' },
  { key: 'paies', label: 'Paies' },
  { key: 'comptesTransfert', label: 'Comptes Wave' },
  { key: 'incidents', label: 'Incidents' },
];

export function FusionLivreursDialog({ ids, isOpen, onOpenChange, onDone }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const qc = useQueryClient();

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ['livreur-donnees-rattachees', ...[...ids].sort()],
    queryFn: () => donneesRattacheesRequest(ids),
    enabled: isOpen && ids.length >= 2,
    staleTime: 30 * 1000,
  });

  const comptes = useMemo(() => data ?? [], [data]);
  // Défaut : garder le compte qui a le PLUS de données (total le plus élevé).
  const suggereId = useMemo(() => {
    if (comptes.length === 0) return '';
    return [...comptes].sort((a, b) => b.total - a.total)[0].livreurId;
  }, [comptes]);
  const maxTotal = useMemo(() => Math.max(0, ...comptes.map((c) => c.total)), [comptes]);

  const [gardeId, setGardeId] = useState('');
  useEffect(() => {
    if (isOpen && suggereId) setGardeId(suggereId);
  }, [isOpen, suggereId]);

  const fusion = useMutation({
    mutationFn: () => {
      const supprimeIds = ids.filter((id) => id !== gardeId);
      return fusionnerLivreursRequest(gardeId, supprimeIds, userId ?? '');
    },
    onSuccess: (r) => {
      toast.success(`Fusion effectuée : ${r.fusionnes} compte(s) rattaché(s).`);
      qc.invalidateQueries({ queryKey: turboyKeys.lists() });
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: unknown) => {
      toast.error(`Échec de la fusion : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    },
  });

  const [confirme, setConfirme] = useState(false);
  useEffect(() => {
    if (!isOpen) setConfirme(false);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-4xl">
            <Modal.Header>
              <div className="flex flex-col gap-1">
                {/* Le titre etait peint en ROUGE DE MARQUE, la couleur reservee ici a ce
                    qui appelle une action — or l'action est le bouton, en bas. */}
                <Modal.Heading className="flex items-center gap-2">
                  <GitMerge aria-hidden="true" className="size-5" />
                  Fusionner des comptes livreurs en doublon
                </Modal.Heading>
                <span className="text-xs text-muted">
                  Choisissez le compte à GARDER. Les données des autres y sont réassignées,
                  puis ils sont désactivés (réversible). Aucune donnée n&apos;est perdue.
                </span>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ids.map((id) => (
                    <div className="h-56 animate-pulse rounded-xl bg-surface-secondary" key={id} />
                  ))}
                </div>
              ) : isError ? (
                /* L'echec etait une phrase rouge, sans moyen de relancer : sur une fenetre
                   qu'on ouvre pour agir, le seul recours etait de tout refermer. */
                <EtatErreur
                  enCours={isFetching}
                  onReessayer={() => void refetch()}
                  quoi="les données rattachées"
                />
              ) : (
                <RadioGroup onChange={setGardeId} value={gardeId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {comptes.map((c) => {
                      const estSuggere = c.total === maxTotal && maxTotal > 0;
                      const estGarde = c.livreurId === gardeId;
                      return (
                        <div
                          className={`rounded-xl border p-3 transition-colors ${
                            estGarde ? 'border-accent bg-accent-soft' : 'border-separator'
                          }`}
                          key={c.livreurId}
                        >
                          {/*
                           * La pastille de choix etait un `<Radio>` SANS libelle, pose a
                           * cote du nom : la zone cliquable se limitait au cercle de
                           * quelques pixels, et le lecteur d'ecran annoncait un bouton
                           * radio sans nom. Le nom du livreur EST le libelle du choix.
                           */}
                          <Radio value={c.livreurId}>
                            <Radio.Content className="items-start gap-3">
                              <Radio.Control className="mt-1">
                                <Radio.Indicator />
                              </Radio.Control>
                              <Avatar className="size-8 shrink-0">
                                {c.avatarUrl && (
                                  <Avatar.Image
                                    alt={c.nomComplet}
                                    src={createUrlFile(c.avatarUrl, 'backend')}
                                  />
                                )}
                                <Avatar.Fallback>{getInitials(c.nomComplet)}</Avatar.Fallback>
                              </Avatar>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {c.nomComplet}
                                  </span>
                                  {/* « + de donnees » etait VERT, comme si ce compte etait
                                      le bon. C'est un indice de volume, pas un verdict. */}
                                  {estSuggere && (
                                    <Chip size="sm" variant="soft">
                                      <Chip.Label>+ de données</Chip.Label>
                                    </Chip>
                                  )}
                                </div>
                                <p className="truncate text-xs text-muted">
                                  {c.email ?? c.telephone ?? '—'}
                                </p>
                              </div>
                            </Radio.Content>
                          </Radio>

                          <dl className="mt-3 flex flex-col gap-1 border-t border-separator pt-2">
                            {METRIQUES.map((m) => (
                              <div className="flex justify-between text-xs" key={m.key}>
                                <dt className="text-muted">{m.label}</dt>
                                <dd className="font-medium tabular-nums text-foreground">
                                  {c[m.key] as number}
                                </dd>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-separator pt-1 text-xs font-semibold">
                              <dt className="text-foreground">Total</dt>
                              <dd className="tabular-nums text-foreground">{c.total}</dd>
                            </div>
                          </dl>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {!isLoading && !isError && (
                /*
                 * La confirmation etait un `<input type="checkbox">` nu, place APRES la
                 * phrase, dans un `<label>` peint a la main en `bg-warning-50
                 * text-warning-800` — deux tons ambres sans variante sombre. Sur un poste
                 * en theme sombre, la seule phrase qui dit ce qu'on s'apprete a faire
                 * etait illisible.
                 */
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Checkbox isSelected={confirme} onChange={setConfirme}>
                      <Checkbox.Content className="items-start">
                        <Checkbox.Control className="mt-0.5">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <span className="flex-1 text-left text-xs">
                          Je confirme fusionner les {ids.length} comptes dans le compte
                          sélectionné. Les autres seront désactivés (réversible).
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                  </Alert.Content>
                </Alert>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                isDisabled={fusion.isPending}
                onPress={() => onOpenChange(false)}
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                isDisabled={!gardeId || !confirme || comptes.length < 2 || !userId}
                isPending={fusion.isPending}
                onPress={() => fusion.mutate()}
                variant="primary"
              >
                <GitMerge aria-hidden="true" className="size-4" />
                Fusionner dans ce compte
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
