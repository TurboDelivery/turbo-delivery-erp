'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Chip, Modal, Radio, RadioGroup, Spinner } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AlertTriangle, GitMerge } from 'lucide-react';

import {
  donneesRattacheesCategoriesRequest,
  fusionnerCategoriesRequest,
  type ICategorieDonneesRattachees,
} from '@/features/depenses/apis/fusion-categorie.api';
import { useInvalidateDepenseQuery } from '@/features/depenses/queries/category/index.query';

interface Props {
  ids: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}

const METRIQUES: { key: keyof ICategorieDonneesRattachees; label: string }[] = [
  { key: 'chargesFixes', label: 'Charges fixes' },
  { key: 'chargesVariables', label: 'Dépenses variables' },
  { key: 'depenses', label: 'Dépenses (décaissées)' },
];

/**
 * Fusion de catégories de dépense en DOUBLON. On choisit la catégorie à GARDER :
 * charges fixes / variables / dépenses des autres y sont réassignées, puis les
 * catégories perdantes sont SUPPRIMÉES (définitif). Miroir de la fusion livreurs.
 */
export function FusionCategoriesDialog({ ids, isOpen, onOpenChange, onDone }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const invalider = useInvalidateDepenseQuery();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['categorie-donnees-rattachees', ...[...ids].sort()],
    queryFn: () => donneesRattacheesCategoriesRequest(ids),
    enabled: isOpen && ids.length >= 2,
    staleTime: 30 * 1000,
  });

  const cats = useMemo(() => data ?? [], [data]);
  // Défaut : garder la catégorie qui porte le PLUS de données (total le plus élevé).
  const suggereId = useMemo(() => {
    if (cats.length === 0) return '';
    return [...cats].sort((a, b) => b.total - a.total)[0].id;
  }, [cats]);
  const maxTotal = useMemo(() => Math.max(0, ...cats.map((c) => c.total)), [cats]);

  const [gardeId, setGardeId] = useState('');
  useEffect(() => {
    if (isOpen && suggereId) setGardeId(suggereId);
  }, [isOpen, suggereId]);

  const [confirme, setConfirme] = useState(false);
  useEffect(() => {
    if (!isOpen) setConfirme(false);
  }, [isOpen]);

  const fusion = useMutation({
    mutationFn: () => {
      const supprimeIds = ids.filter((id) => id !== gardeId);
      return fusionnerCategoriesRequest(gardeId, supprimeIds, userId ?? '');
    },
    onSuccess: async (r) => {
      toast.success(`Fusion effectuée : ${r.fusionnes} catégorie(s) fusionnée(s).`);
      await invalider();
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: unknown) => {
      toast.error(`Échec de la fusion : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    },
  });

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <GitMerge aria-hidden="true" className="size-5" />
                  Fusionner des catégories en doublon
                </span>
                <span className="text-xs font-normal text-muted">
                  Choisis la catégorie à GARDER. Les charges et dépenses des autres y sont
                  réassignées, puis les catégories perdantes sont supprimées (définitif).
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <Spinner />
                  <p className="text-sm text-muted">Analyse des données rattachées…</p>
                </div>
              ) : isError ? (
                <p className="py-6 text-center text-sm text-danger-soft-foreground">
                  Impossible de charger les données rattachées.
                </p>
              ) : (
                <RadioGroup onChange={setGardeId} value={gardeId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cats.map((c) => {
                      const estSuggere = c.total === maxTotal && maxTotal > 0;
                      const estGarde = c.id === gardeId;
                      return (
                        <div
                          className={cn(
                            'rounded-xl border p-3 transition-colors',
                            estGarde ? 'border-accent bg-accent-soft/30' : 'border-separator',
                          )}
                          key={c.id}
                        >
                          <Radio className="w-full items-start" value={c.id}>
                            <Radio.Content className="flex w-full items-start gap-3">
                              <Radio.Control className="mt-1">
                                <Radio.Indicator />
                              </Radio.Control>
                              <span className="flex min-w-0 flex-1 flex-col items-start">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {c.nomCategorie}
                                  </span>
                                  {estSuggere && (
                                    <Chip color="success" size="sm" variant="soft">
                                      <Chip.Label>+ de données</Chip.Label>
                                    </Chip>
                                  )}
                                </span>
                                {c.description && (
                                  <span className="truncate text-xs text-muted">{c.description}</span>
                                )}
                              </span>
                            </Radio.Content>
                          </Radio>

                          <div className="mt-3 flex flex-col gap-1 border-t border-separator pt-2">
                            {METRIQUES.map((m) => (
                              <div className="flex justify-between text-xs" key={m.key}>
                                <span className="text-muted">{m.label}</span>
                                <span className="font-medium tabular-nums text-foreground">
                                  {c[m.key] as number}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-separator pt-1 text-xs font-semibold">
                              <span className="text-muted">Total lignes</span>
                              <span className="tabular-nums text-foreground">{c.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {/*
               * La confirmation etait un `<input type="checkbox">` BRUT dans un `<label>`
               * peint en `bg-warning-50 text-warning-800` : deux teintes de l'ancienne
               * palette pour un avertissement qui, lui, dit bien quelque chose.
               */}
              {!isLoading && !isError && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
                  />
                  <Checkbox isSelected={confirme} onChange={setConfirme}>
                    <Checkbox.Content className="items-start">
                      <Checkbox.Control className="mt-0.5">
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="flex-1 text-left">
                        Je confirme fusionner les {ids.length} catégories dans celle sélectionnée.
                        Les autres seront supprimées définitivement.
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                </div>
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
                isDisabled={!gardeId || !confirme || cats.length < 2 || !userId}
                isPending={fusion.isPending}
                onPress={() => fusion.mutate()}
                variant="primary"
              >
                {fusion.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <GitMerge aria-hidden="true" className="size-4" />
                )}
                Fusionner dans cette catégorie
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
