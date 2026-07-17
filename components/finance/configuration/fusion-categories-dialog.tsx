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
  Spinner,
} from '@heroui/react';
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-primary">
                <GitMerge className="h-5 w-5" />
                Fusionner des catégories en doublon
              </span>
              <span className="text-xs font-normal text-default-400">
                Choisis la catégorie à GARDER. Les charges et dépenses des autres y sont
                réassignées, puis les catégories perdantes sont supprimées (définitif).
              </span>
            </ModalHeader>

            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Analyse des données rattachées…" />
                </div>
              ) : isError ? (
                <p className="py-6 text-center text-sm text-danger">
                  Impossible de charger les données rattachées.
                </p>
              ) : (
                <RadioGroup value={gardeId} onValueChange={setGardeId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cats.map((c) => {
                      const estSuggere = c.total === maxTotal && maxTotal > 0;
                      const estGarde = c.id === gardeId;
                      return (
                        <div
                          key={c.id}
                          className={`rounded-xl border p-3 transition-colors ${
                            estGarde ? 'border-primary bg-primary-50' : 'border-default-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Radio value={c.id} className="mt-1" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-default-800">
                                  {c.nomCategorie}
                                </span>
                                {estSuggere && (
                                  <Chip size="sm" color="success" variant="flat">
                                    + de données
                                  </Chip>
                                )}
                              </div>
                              {c.description && (
                                <p className="truncate text-xs text-default-400">{c.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 border-t border-default-100 pt-2">
                            {METRIQUES.map((m) => (
                              <div key={m.key} className="flex justify-between text-xs">
                                <span className="text-default-500">{m.label}</span>
                                <span className="font-medium tabular-nums text-default-700">
                                  {c[m.key] as number}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-default-100 pt-1 text-xs font-semibold">
                              <span className="text-default-600">Total lignes</span>
                              <span className="tabular-nums text-primary">{c.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {!isLoading && !isError && (
                <label className="mt-2 flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span className="flex-1">
                    Je confirme fusionner les {ids.length} catégories dans celle sélectionnée. Les
                    autres seront supprimées définitivement.
                  </span>
                  <input
                    type="checkbox"
                    checked={confirme}
                    onChange={(e) => setConfirme(e.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                </label>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={fusion.isPending}>
                Annuler
              </Button>
              <Button
                color="primary"
                startContent={<GitMerge className="h-4 w-4" />}
                isLoading={fusion.isPending}
                isDisabled={!gardeId || !confirme || cats.length < 2 || !userId}
                onPress={() => fusion.mutate()}
              >
                Fusionner dans cette catégorie
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
